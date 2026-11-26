package com.tripbuilder.service.booking;

import com.tripbuilder.entity.booking.Booking;
import com.tripbuilder.entity.booking.BookingRevision;
import com.tripbuilder.entity.booking.BookingStatus;
import com.tripbuilder.entity.booking.BookingStep;
import com.tripbuilder.repository.BookingRepository;

import com.tripbuilder.dto.request.booking.BookingStepRequest;
import com.tripbuilder.dto.request.booking.CancelBookingRequest;
import com.tripbuilder.dto.request.booking.CreateBookingRequest;
import com.tripbuilder.dto.request.booking.CustomizeRequest;
import com.tripbuilder.dto.request.booking.RequoteRequest;
import com.tripbuilder.dto.request.booking.ReviewRequest;
import com.tripbuilder.dto.response.booking.BookingDto;
import com.tripbuilder.dto.response.booking.BookingRevisionDto;
import com.tripbuilder.dto.response.booking.BookingStepDto;
import com.tripbuilder.dto.response.tour.TourDto;
import com.tripbuilder.dto.response.user.UserDto;
import com.tripbuilder.entity.catalog.PresetOption;
import com.tripbuilder.repository.PresetOptionRepository;
import com.tripbuilder.exception.BadRequestException;
import com.tripbuilder.exception.ForbiddenException;
import com.tripbuilder.service.notification.NotificationService;
import com.tripbuilder.util.Money;
import com.tripbuilder.entity.region.Region;
import com.tripbuilder.entity.tour.Tour;
import com.tripbuilder.service.tour.TourService;
import com.tripbuilder.entity.tour.TourStep;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class BookingService {

    private static final int MAX_REVISION_NOTE_LENGTH = 1500;

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final TourService tourService;
    private final PresetOptionRepository presetOptionRepository;
    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    // ===================== Nghiệp vụ =====================

    @Transactional(readOnly = true)
    public List<BookingDto> list(Long customerId, Long guideId) {
        List<Booking> list;
        if (customerId != null) {
            list = bookingRepository.findByCustomerIdOrderByUpdatedAtDesc(customerId);
        } else if (guideId != null) {
            list = bookingRepository.findByGuideIdOrderByUpdatedAtDesc(guideId);
        } else {
            list = bookingRepository.findAllByOrderByUpdatedAtDesc();
        }
        return list.stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public BookingDto get(Long id, AppUser actingUser) {
        Booking b = find(id);
        if (actingUser != null && !canView(b, actingUser)) {
            throw new ForbiddenException("Bạn không có quyền xem đơn đặt tour này");
        }
        return toDto(b);
    }

    @Transactional
    public BookingDto create(CreateBookingRequest req) {
        if (req == null) {
            throw new BadRequestException("Dữ liệu đặt tour không hợp lệ");
        }
        Tour tour = tourService.find(req.tourId() == null ? -1 : req.tourId());
        AppUser customer = userRepository.findById(req.customerId() == null ? -1 : req.customerId())
                .filter(u -> u.getRole() == Role.CUSTOMER)
                .orElseThrow(() -> new BadRequestException("Tài khoản khách hàng không hợp lệ"));

        int days = req.days() != null ? req.days() : tour.getDays();
        validateDays(days);
        int[] guestCounts = resolveGuestCounts(req.guests(), req.adults(), req.children(), 2);
        int guests = guestCounts[0];
        int adults = guestCounts[1];
        int children = guestCounts[2];
        validateGuests(guests);
        LocalDate start = req.startDate() != null ? req.startDate() : LocalDate.now().plusDays(14);
        if (!start.isAfter(LocalDate.now())) {
            throw new BadRequestException("Ngày khởi hành phải cách hiện tại ít nhất 1 ngày");
        }
        String customerNote = trimWithMaxLength(req.customerNote(), "Ghi chú khách hàng", 1000);
        String mode = "REMOTE".equalsIgnoreCase(req.serviceMode()) ? "REMOTE" : "COMPANION";
        LocalDateTime now = LocalDateTime.now();

        var recentDup = bookingRepository
                .findFirstByCustomerIdAndTourIdAndStartDateAndDaysAndGuestsAndCreatedAtAfterOrderByIdDesc(
                        customer.getId(), tour.getId(), start, days, guests, now.minusSeconds(5));
        if (recentDup.isPresent()
                && (recentDup.get().getStatus() == BookingStatus.BOOKED_ORIGINAL
                || recentDup.get().getStatus() == BookingStatus.WAITING_REQUOTE)) {
            return toDto(recentDup.get());
        }

        int tourVer = tour.getVersion() != null ? tour.getVersion() : 1;

        Booking b = Booking.builder()
                .tour(tour)
                .tourTitleSnapshot(tour.getTitle())
                .tourVersionSnapshot(tourVer)
                .customer(customer)
                .guide(tour.getGuide())
                .startDate(start)
                .days(days)
                .guests(guests)
                .adults(adults)
                .children(children)
                .serviceMode(mode)
                .customerNote(customerNote)
                .originalPricePerPerson(tour.getBasePricePerPerson())
                .currentPricePerPerson(tour.getBasePricePerPerson())
                .groupAdjustment(0L)
                .totalPrice(tour.getBasePricePerPerson() * guests)
                .guideAccepted(false)
                .depositPercent(30)
                .depositPaid(false)
                .revisionCount(1)
                .postConfirmAdjustment(false)
                .status(BookingStatus.BOOKED_ORIGINAL)
                .createdAt(now)
                .updatedAt(now)
                .build();

        if (req.steps() != null && !req.steps().isEmpty()) {
            applySteps(b, req.steps(), days, guests, 0L, Role.CUSTOMER, List.of());
            boolean scheduleChanged = b.getDays() != tour.getDays()
                    || b.getSteps().size() != tour.getSteps().size()
                    || !Objects.equals(b.getCurrentPricePerPerson(), b.getOriginalPricePerPerson())
                    || b.getSteps().stream().anyMatch(s -> !"PRESET".equals(s.getNoteType()));
            b.setStatus(scheduleChanged ? BookingStatus.WAITING_REQUOTE : BookingStatus.BOOKED_ORIGINAL);
        } else {
            int order = 1;
            for (TourStep ts : tour.getSteps()) {
                b.getSteps().add(BookingStep.builder()
                        .booking(b)
                        .dayNumber(ts.getDayNumber())
                        .category(ts.getCategory())
                        .title(ts.getTitle())
                        .imageUrl(ts.getImageUrl())
                        .pricePerPerson(ts.getPricePerPerson())
                        .originalTitle(ts.getTitle())
                        .originalPricePerPerson(ts.getPricePerPerson())
                        .noteType("PRESET")
                        .sortOrder(order++)
                        .build());
            }
            if (days != tour.getDays()) {
                b.setStatus(BookingStatus.WAITING_REQUOTE);
            }
        }

        b = bookingRepository.save(b);
        b.setCode(String.format("BK-%04d", b.getId()));
        String revNote = b.getCustomerNote() != null ? b.getCustomerNote() : summarizeCreate(b);
        addRevision(b, "CUSTOMER", customer.getFullName(),
                b.getStatus() == BookingStatus.WAITING_REQUOTE ? "Đặt tour kèm tuỳ chỉnh" : "Đặt theo lịch chuẩn",
                revNote, b.getTotalPrice(), now);
        notificationService.notify(
                b.getGuide(),
                "BOOKING_CREATED",
                "Đơn đặt tour mới " + b.getCode(),
                customer.getFullName() + " vừa đặt tour \"" + b.getTourTitleSnapshot() + "\" (" + b.getDays() + " ngày · " + b.getGuests() + " khách).",
                b.getId()
        );
        return toDto(b);
    }

    /**
     * Khách chỉnh sửa lịch trình:
     * - Từ BOOKED_ORIGINAL / WAITING_REQUOTE -> WAITING_REQUOTE
     * - Từ REQUOTED (đàm phán vòng tiếp) -> WAITING_REQUOTE (trừ khi chỉ đồng ý ALTERNATIVE -> giữ REQUOTED)
     * - Từ CONFIRMED / CHANGE_REQUESTED (xin đổi sau chốt) -> CHANGE_REQUESTED
     */
    @Transactional
    public BookingDto customize(Long id, CustomizeRequest req, AppUser actingCustomer) {
        if (req == null) {
            throw new BadRequestException("Dữ liệu điều chỉnh lịch trình không hợp lệ");
        }
        Booking b = find(id);
        if (actingCustomer != null && !b.getCustomer().getId().equals(actingCustomer.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể chỉnh sửa đơn đặt tour của chính mình");
        }
        if (b.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đã huỷ không thể chỉnh sửa");
        }
        if (b.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Đơn đã hoàn thành không thể chỉnh sửa");
        }

        BookingStatus prevStatus = b.getStatus();
        boolean fromConfirmed = prevStatus == BookingStatus.CONFIRMED || prevStatus == BookingStatus.CHANGE_REQUESTED;
        if (prevStatus == BookingStatus.CONFIRMED && b.getConfirmedTotalPrice() == null) {
            b.setConfirmedTotalPrice(b.getTotalPrice());
        }

        int prevDays = b.getDays();
        int prevGuests = b.getGuests();
        LocalDate prevStartDate = b.getStartDate();
        String prevServiceMode = b.getServiceMode() == null ? "COMPANION" : b.getServiceMode();

        int days = req.days() != null ? req.days() : b.getDays();
        validateDays(days);
        int[] guestCounts = resolveGuestCounts(req.guests(), req.adults(), req.children(), b.getGuests());
        int guests = guestCounts[0];
        validateGuests(guests);
        b.setAdults(guestCounts[1]);
        b.setChildren(guestCounts[2]);

        if (req.startDate() != null && !req.startDate().equals(b.getStartDate())) {
            if (!req.startDate().isAfter(LocalDate.now())) {
                throw new BadRequestException("Ngày khởi hành phải cách hiện tại ít nhất 1 ngày");
            }
            b.setStartDate(req.startDate());
        } else if (b.getStartDate() != null && !b.getStartDate().isAfter(LocalDate.now())) {
            throw new BadRequestException("Ngày khởi hành phải cách hiện tại ít nhất 1 ngày");
        }
        if (req.serviceMode() != null && !req.serviceMode().isBlank()) {
            b.setServiceMode("REMOTE".equalsIgnoreCase(req.serviceMode()) ? "REMOTE" : "COMPANION");
        }
        b.setCustomerNote(trimWithMaxLength(req.customerNote(), "Ghi chú khách hàng", 1000));

        List<BookingStep> previousSteps = new ArrayList<>(b.getSteps());
        long currentGroupAdj = b.getGroupAdjustment() != null ? b.getGroupAdjustment() : 0L;
        applySteps(b, req.steps(), days, guests, currentGroupAdj, Role.CUSTOMER, previousSteps);

        boolean isPureAlternativeAcceptance = isPureAlternativeAcceptance(
                prevStatus, prevDays, prevGuests, prevStartDate, prevServiceMode, previousSteps, b);

        if (!isPureAlternativeAcceptance && currentGroupAdj != 0L) {
            b.setGroupAdjustment(0L);
            b.setTotalPrice(Math.max(0L, b.getCurrentPricePerPerson() * guests));
        }

        String actionLabel;
        if (isPureAlternativeAcceptance) {
            b.setStatus(BookingStatus.REQUOTED);
            actionLabel = "Khách đồng ý phương án thay thế của Guide";
        } else if (fromConfirmed) {
            b.setPostConfirmAdjustment(true);
            b.setStatus(BookingStatus.CHANGE_REQUESTED);
            actionLabel = "Xin điều chỉnh sau khi chốt";
        } else {
            boolean scheduleChanged = prevStatus == BookingStatus.REQUOTED
                    || !Objects.equals(b.getCurrentPricePerPerson(), b.getOriginalPricePerPerson())
                    || b.getSteps().stream().anyMatch(s -> !"PRESET".equals(s.getNoteType()));
            b.setStatus(scheduleChanged ? BookingStatus.WAITING_REQUOTE : BookingStatus.BOOKED_ORIGINAL);
            actionLabel = prevStatus == BookingStatus.REQUOTED
                    ? "Điều chỉnh lại sau báo giá"
                    : "Cập nhật giỏ lịch trình";
        }

        LocalDateTime now = LocalDateTime.now();
        b.setUpdatedAt(now);
        String revNote = b.getCustomerNote() != null
                ? b.getCustomerNote()
                : (isPureAlternativeAcceptance
                    ? "Đồng ý phương án thay thế của Guide (" + b.getDays() + " ngày · " + b.getGuests() + " khách)."
                    : summarizeCustomerChange(prevDays, prevGuests, b));
        addRevision(b, "CUSTOMER", b.getCustomer().getFullName(), actionLabel, revNote, b.getTotalPrice(), now);
        bookingRepository.flush();
        notificationService.notify(
                b.getGuide(),
                "BOOKING_CUSTOMIZED",
                "Khách cập nhật đơn " + b.getCode(),
                b.getCustomer().getFullName() + " vừa gửi: " + actionLabel + ".",
                b.getId()
        );
        return toDto(b);
    }

    /** Khách đánh giá Tour Guide sau chuyến đi (chỉ khi đơn đã COMPLETED). */
    @Transactional
    public BookingDto review(Long id, ReviewRequest req, AppUser actingCustomer) {
        Booking b = find(id);
        if (actingCustomer != null && !b.getCustomer().getId().equals(actingCustomer.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể đánh giá đơn của chính mình");
        }
        if (b.getStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("Chỉ có thể đánh giá sau khi chuyến đi đã hoàn thành");
        }
        if (req == null || req.rating() < 1 || req.rating() > 5) {
            throw new BadRequestException("Số sao đánh giá phải từ 1 đến 5");
        }
        String reviewText = trimWithMaxLength(req.review(), "Nội dung đánh giá", 1000);
        b.setCustomerRating(req.rating());
        b.setCustomerReview(reviewText);
        b.setUpdatedAt(LocalDateTime.now());
        bookingRepository.flush();
        return toDto(b);
    }

    /** Tour Guide xác nhận lịch trống cho đơn đặt tour. */
    @Transactional
    public BookingDto accept(Long id, AppUser actingGuide) {
        Booking b = find(id);
        if (actingGuide != null && !b.getGuide().getId().equals(actingGuide.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể xác nhận đơn thuộc tour của mình");
        }
        if (b.getStatus() == BookingStatus.CANCELLED || b.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Đơn ở trạng thái hiện tại không thể xác nhận lịch trống");
        }
        ensureNoCompanionOverlap(b.getGuide().getId(), b.getStartDate(), b.getDays(), b.getId(), b.getServiceMode());
        LocalDateTime now = LocalDateTime.now();
        b.setGuideAccepted(true);
        b.setUpdatedAt(now);
        addRevision(b, "GUIDE", b.getGuide().getFullName(), "Guide xác nhận lịch trống",
                "Hướng dẫn viên đã xác nhận lịch trống cho chuyến đi.", b.getTotalPrice(), now);
        bookingRepository.flush();
        notificationService.notify(
                b.getCustomer(),
                "BOOKING_ACCEPTED",
                "Guide đã xác nhận lịch trống " + b.getCode(),
                b.getGuide().getFullName() + " đã xác nhận sẵn sàng cho chuyến đi \"" + b.getTourTitleSnapshot() + "\".",
                b.getId()
        );
        return toDto(b);
    }

    /**
     * Tour Guide kiểm tra & gửi Báo giá lại (từ chối nếu đơn đang ở trạng thái CONFIRMED).
     */
    @Transactional
    public BookingDto requote(Long id, RequoteRequest req, AppUser actingGuide) {
        if (req == null) {
            throw new BadRequestException("Dữ liệu báo giá không hợp lệ");
        }
        Booking b = find(id);
        if (actingGuide != null && !b.getGuide().getId().equals(actingGuide.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể báo giá cho đơn thuộc tour của mình");
        }
        if (b.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đã huỷ không thể báo giá");
        }
        if (b.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Đơn đã hoàn thành không thể báo giá lại");
        }
        if (b.getStatus() == BookingStatus.CONFIRMED) {
            throw new BadRequestException("Không thể tự ý báo giá lại đơn đã chốt khi chưa có yêu cầu điều chỉnh từ khách");
        }

        int days = req.days() != null ? req.days() : b.getDays();
        validateDays(days);
        int guests = req.guests() != null ? req.guests() : b.getGuests();
        validateGuests(guests);
        ensureNoCompanionOverlap(b.getGuide().getId(), b.getStartDate(), days, b.getId(), b.getServiceMode());

        long groupAdjustment = req.groupAdjustment() != null
                ? req.groupAdjustment()
                : (b.getGroupAdjustment() != null ? b.getGroupAdjustment() : 0L);
        b.setGuideNote(trimWithMaxLength(req.guideNote(), "Ghi chú của Tour Guide", 1000));

        List<BookingStep> previousSteps = new ArrayList<>(b.getSteps());
        applySteps(b, req.steps(), days, guests, groupAdjustment, Role.GUIDE, previousSteps);
        b.setGuideAccepted(true);
        b.setStatus(BookingStatus.REQUOTED);

        LocalDateTime now = LocalDateTime.now();
        b.setUpdatedAt(now);
        String actionLabel = Boolean.TRUE.equals(b.getPostConfirmAdjustment())
                ? "Guide gửi báo giá điều chỉnh"
                : "Guide gửi báo giá";
        String revNote = b.getGuideNote() != null ? b.getGuideNote() : summarizeGuideRequote(b);
        addRevision(b, "GUIDE", b.getGuide().getFullName(), actionLabel, revNote, b.getTotalPrice(), now);
        bookingRepository.flush();
        notificationService.notify(
                b.getCustomer(),
                "BOOKING_REQUOTED",
                "Guide đã gửi báo giá mới " + b.getCode(),
                b.getGuide().getFullName() + " vừa gửi báo giá " + Money.format(b.getTotalPrice()) + " cho chuyến đi của bạn.",
                b.getId()
        );
        return toDto(b);
    }

    /** Khách đồng ý & chốt chuyến đi. */
    @Transactional
    public BookingDto confirm(Long id, AppUser actingCustomer) {
        Booking b = find(id);
        if (actingCustomer != null && !b.getCustomer().getId().equals(actingCustomer.getId())) {
            throw new ForbiddenException("Chỉ khách hàng của đơn mới có quyền chốt chuyến");
        }
        if (b.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đã huỷ không thể chốt");
        }
        if (b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Đơn này đã được chốt trước đó");
        }

        if (b.getStatus() == BookingStatus.BOOKED_ORIGINAL) {
            boolean purePreset = !b.getSteps().isEmpty()
                    && b.getSteps().stream().allMatch(s -> "PRESET".equals(s.getNoteType()))
                    && Objects.equals(b.getCurrentPricePerPerson(), b.getOriginalPricePerPerson());
            if (!purePreset) {
                throw new BadRequestException("Đơn có tuỳ chỉnh cần được Tour Guide báo giá trước khi chốt");
            }
            if (!Boolean.TRUE.equals(b.getGuideAccepted())) {
                throw new BadRequestException("Đơn đang chờ Hướng dẫn viên xác nhận lịch trống trước khi chốt");
            }
        } else if (b.getStatus() == BookingStatus.REQUOTED) {
            if (!Boolean.TRUE.equals(b.getGuideAccepted())) {
                throw new BadRequestException("Đơn đang chờ Hướng dẫn viên xác nhận lịch trống trước khi chốt");
            }
            boolean hasUnpricedStep = b.getSteps().stream()
                    .anyMatch(s -> "CUSTOM".equals(s.getNoteType())
                            || (!"REMOVED".equals(s.getNoteType()) && s.getPricePerPerson() == null));
            if (hasUnpricedStep) {
                throw new BadRequestException("Còn mục yêu cầu thêm chưa được Guide báo giá.");
            }
        } else {
            throw new BadRequestException("Đơn đang chờ Tour Guide báo giá, chưa thể chốt chuyến");
        }

        ensureNoCompanionOverlap(b.getGuide().getId(), b.getStartDate(), b.getDays(), b.getId(), b.getServiceMode());
        if (b.getTotalPrice() == null || b.getTotalPrice() <= 0) {
            throw new BadRequestException("Tổng tiền đơn hàng phải lớn hơn 0đ trước khi chốt");
        }

        LocalDateTime now = LocalDateTime.now();
        long depositAmount = Math.round(b.getTotalPrice() * 0.3);
        b.setStatus(BookingStatus.CONFIRMED);
        b.setConfirmedTotalPrice(b.getTotalPrice());
        b.setDepositPercent(30);
        b.setDepositAmount(depositAmount);
        b.setDepositPaid(true);
        b.setPostConfirmAdjustment(false);
        b.setConfirmedSnapshotJson(serializeConfirmedSnapshot(b));
        b.setUpdatedAt(now);
        String revNote = "Chốt lịch trình " + b.getDays() + " ngày · " + b.getGuests()
                + " khách, tổng " + Money.format(b.getTotalPrice())
                + " (đặt cọc 30%: " + Money.format(depositAmount) + ").";
        addRevision(b, "CUSTOMER", b.getCustomer().getFullName(), "Khách đồng ý chốt chuyến", revNote, b.getTotalPrice(), now);
        notificationService.notify(
                b.getGuide(),
                "BOOKING_CONFIRMED",
                "Khách đã chốt đơn " + b.getCode(),
                b.getCustomer().getFullName() + " đã chốt chuyến và thanh toán cọc 30% (" + Money.format(depositAmount) + ").",
                b.getId()
        );
        return toDto(b);
    }

    /** Từ chối điều chỉnh sau chốt và khôi phục về snapshot đã chốt gần nhất. */
    @Transactional
    public BookingDto rejectChange(Long id, AppUser actingUser) {
        Booking b = find(id);
        if (actingUser != null && !b.getGuide().getId().equals(actingUser.getId())
                && !b.getCustomer().getId().equals(actingUser.getId())) {
            throw new ForbiddenException("Bạn không có quyền thực hiện thao tác này");
        }
        boolean canRollback = (b.getStatus() == BookingStatus.CHANGE_REQUESTED || Boolean.TRUE.equals(b.getPostConfirmAdjustment()))
                && b.getConfirmedSnapshotJson() != null && !b.getConfirmedSnapshotJson().isBlank();
        if (!canRollback) {
            throw new BadRequestException("Đơn không có yêu cầu điều chỉnh sau chốt để khôi phục");
        }

        ConfirmedSnapshot snap = deserializeConfirmedSnapshot(b.getConfirmedSnapshotJson());
        b.setStartDate(snap.startDate());
        b.setDays(snap.days());
        b.setGuests(snap.guests());
        b.setAdults(snap.adults());
        b.setChildren(snap.children());
        b.setServiceMode(snap.serviceMode());
        b.setGroupAdjustment(snap.groupAdjustment());
        b.setTotalPrice(snap.totalPrice());
        b.setConfirmedTotalPrice(snap.totalPrice());

        b.getSteps().clear();
        long perPerson = 0;
        int order = 1;
        if (snap.steps() != null) {
            for (BookingStepRequest s : snap.steps()) {
                long p = s.pricePerPerson();
                if (!"REMOVED".equals(s.noteType())) {
                    perPerson += p;
                }
                b.getSteps().add(BookingStep.builder()
                        .booking(b)
                        .dayNumber(s.dayNumber())
                        .category(s.category())
                        .title(s.title())
                        .imageUrl(s.imageUrl())
                        .pricePerPerson(p)
                        .originalTitle(s.originalTitle())
                        .originalPricePerPerson(s.originalPricePerPerson())
                        .noteType(s.noteType())
                        .sortOrder(order++)
                        .build());
            }
        }
        b.setCurrentPricePerPerson(perPerson);
        b.setStatus(BookingStatus.CONFIRMED);
        b.setPostConfirmAdjustment(false);
        LocalDateTime now = LocalDateTime.now();
        b.setUpdatedAt(now);

        String actorRole = actingUser != null ? actingUser.getRole().name() : "GUIDE";
        String actorName = actingUser != null ? actingUser.getFullName() : b.getGuide().getFullName();
        addRevision(b, actorRole, actorName, "Từ chối điều chỉnh, khôi phục lịch đã chốt",
                "Khôi phục lịch trình đã chốt trước đó (" + b.getDays() + " ngày · " + b.getGuests() + " khách, " + Money.format(b.getTotalPrice()) + ").",
                b.getTotalPrice(), now);
        bookingRepository.flush();

        AppUser other = (actingUser != null && actingUser.getId().equals(b.getCustomer().getId()))
                ? b.getGuide() : b.getCustomer();
        notificationService.notify(
                other,
                "BOOKING_REJECT_CHANGE",
                "Khôi phục lịch đã chốt " + b.getCode(),
                actorName + " đã từ chối thay đổi và giữ nguyên lịch trình đã chốt.",
                b.getId()
        );
        return toDto(b);
    }

    /** Tour Guide hoặc Admin đánh dấu chuyến đi đã hoàn thành. */
    @Transactional
    public BookingDto complete(Long id, AppUser actingUser) {
        Booking b = find(id);
        if (actingUser != null && actingUser.getRole() != Role.ADMIN
                && !b.getGuide().getId().equals(actingUser.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể hoàn thành đơn thuộc tour của mình");
        }
        if (b.getStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException("Chỉ có thể hoàn thành đơn đang ở trạng thái Đã chốt");
        }
        LocalDateTime now = LocalDateTime.now();
        b.setStatus(BookingStatus.COMPLETED);
        b.setPostConfirmAdjustment(false);
        b.setUpdatedAt(now);

        String actorRole = actingUser != null ? actingUser.getRole().name() : "GUIDE";
        String actorName = actingUser != null ? actingUser.getFullName() : b.getGuide().getFullName();
        addRevision(b, actorRole, actorName, "Hoàn thành chuyến đi",
                "Chuyến đi đã hoàn thành. Mời khách hàng gửi đánh giá trải nghiệm.", b.getTotalPrice(), now);
        bookingRepository.flush();
        notificationService.notify(
                b.getCustomer(),
                "BOOKING_COMPLETED",
                "Chuyến đi " + b.getCode() + " đã hoàn thành",
                "Cảm ơn bạn đã đồng hành! Hãy để lại đánh giá cho Tour Guide " + b.getGuide().getFullName() + ".",
                b.getId()
        );
        return toDto(b);
    }

    @Transactional
    public BookingDto cancel(Long id, AppUser actingUser) {
        return cancel(id, null, actingUser);
    }

    @Transactional
    public BookingDto cancel(Long id, CancelBookingRequest req, AppUser actingUser) {
        Booking b = find(id);
        if (actingUser != null && !canView(b, actingUser)) {
            throw new ForbiddenException("Bạn không có quyền huỷ đơn này");
        }
        if (b.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đặt tour này đã được huỷ trước đó");
        }
        if (b.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Đơn đã hoàn thành không thể huỷ");
        }
        String reason = trimWithMaxLength(req != null ? req.reason() : null, "Lý do huỷ", 500);
        BookingStatus prevStatus = b.getStatus();
        LocalDateTime now = LocalDateTime.now();
        b.setStatus(BookingStatus.CANCELLED);
        b.setCancelReason(reason);
        b.setUpdatedAt(now);
        String actorRole = actingUser != null ? actingUser.getRole().name() : "CUSTOMER";
        String actorName = actingUser != null ? actingUser.getFullName() : b.getCustomer().getFullName();
        String revNote = "Huỷ đơn từ trạng thái \"" + prevStatus.getLabel() + "\"."
                + (reason != null ? " Lý do: " + reason : "");
        addRevision(b, actorRole, actorName, "Huỷ đơn đặt tour", revNote, b.getTotalPrice(), now);

        AppUser other = (actingUser != null && actingUser.getId().equals(b.getGuide().getId()))
                ? b.getCustomer() : b.getGuide();
        notificationService.notify(
                other,
                "BOOKING_CANCELLED",
                "Đơn " + b.getCode() + " đã bị huỷ",
                actorName + " đã huỷ đơn đặt tour." + (reason != null ? " Lý do: " + reason : ""),
                b.getId()
        );
        return toDto(b);
    }

    // Overload convenience for internal seeder
    @Transactional
    public BookingDto accept(Long id) {
        return accept(id, null);
    }

    @Transactional
    public BookingDto requote(Long id, RequoteRequest req) {
        return requote(id, req, null);
    }

    @Transactional
    public BookingDto confirm(Long id) {
        return confirm(id, null);
    }

    @Transactional
    public BookingDto complete(Long id) {
        return complete(id, null);
    }

    /** Admin điều phối lại Tour Guide phụ trách đơn đặt tour. */
    @Transactional
    public BookingDto reassignGuide(Long bookingId, Long newGuideId, AppUser actingAdmin) {
        if (newGuideId == null) {
            throw new BadRequestException("Vui lòng chọn Tour Guide mới");
        }
        Booking b = find(bookingId);
        if (b.getStatus() == BookingStatus.CANCELLED || b.getStatus() == BookingStatus.COMPLETED) {
            throw new BadRequestException("Không thể điều phối lại Guide cho đơn đã hoàn thành hoặc đã huỷ");
        }
        AppUser newGuide = userRepository.findById(newGuideId)
                .filter(u -> u.getRole() == Role.GUIDE)
                .orElseThrow(() -> new BadRequestException("Tài khoản Tour Guide được chọn không hợp lệ"));

        Region tourRegion = b.getTour() != null ? b.getTour().getRegion() : null;
        if (newGuide.getRegion() == null) {
            throw new BadRequestException("Hướng dẫn viên được chọn chưa được gán vùng phụ trách");
        }
        if (tourRegion != null && !newGuide.getRegion().getId().equals(tourRegion.getId())) {
            throw new BadRequestException("Chỉ được chuyển đơn cho Guide cùng vùng " + tourRegion.getName());
        }

        AppUser oldGuide = b.getGuide();
        if (oldGuide != null && oldGuide.getId().equals(newGuide.getId())) {
            return toDto(b);
        }

        ensureNoCompanionOverlap(newGuide.getId(), b.getStartDate(), b.getDays(), b.getId(), b.getServiceMode());

        LocalDateTime now = LocalDateTime.now();
        b.setGuide(newGuide);
        b.setUpdatedAt(now);

        String adminName = actingAdmin != null ? actingAdmin.getFullName() : "Admin";
        String oldGuideName = oldGuide != null ? oldGuide.getFullName() : "Chưa phân công";
        addRevision(b, "ADMIN", adminName, "Điều phối lại Tour Guide",
                "Chuyển phụ trách từ " + oldGuideName + " sang " + newGuide.getFullName() + ".",
                b.getTotalPrice(), now);
        bookingRepository.flush();

        notificationService.notify(
                b.getCustomer(),
                "BOOKING_REASSIGNED",
                "Cập nhật Hướng dẫn viên cho đơn " + b.getCode(),
                "Admin đã điều phối Hướng dẫn viên " + newGuide.getFullName() + " phụ trách chuyến đi của bạn.",
                b.getId()
        );
        if (oldGuide != null) {
            notificationService.notify(
                    oldGuide,
                    "BOOKING_REASSIGNED",
                    "Đơn " + b.getCode() + " đã được điều phối lại",
                    "Admin đã chuyển đơn " + b.getCode() + " sang cho " + newGuide.getFullName() + ".",
                    b.getId()
            );
        }
        notificationService.notify(
                newGuide,
                "BOOKING_REASSIGNED",
                "Bạn được phân công đơn " + b.getCode(),
                "Admin đã điều phối bạn phụ trách đơn \"" + b.getTourTitleSnapshot() + "\" (" + b.getDays() + " ngày).",
                b.getId()
        );
        return toDto(b);
    }

    @Transactional
    public BookingDto review(Long id, ReviewRequest req) {
        return review(id, req, null);
    }

    // ===================== Helpers =====================

    private boolean canView(Booking b, AppUser user) {
        if (user.getRole() == Role.ADMIN) {
            return true;
        }
        return b.getCustomer().getId().equals(user.getId()) || b.getGuide().getId().equals(user.getId());
    }

    private void addRevision(Booking b, String actorRole, String actorName, String actionLabel,
                             String note, long totalPrice, LocalDateTime now) {
        int nextRound = (b.getRevisionCount() == null ? 0 : b.getRevisionCount()) + (b.getRevisions().isEmpty() ? 0 : 1);
        if (nextRound < 1) nextRound = 1;
        b.setRevisionCount(nextRound);
        String safeNote = trim(note);
        if (safeNote != null && safeNote.length() > MAX_REVISION_NOTE_LENGTH) {
            safeNote = safeNote.substring(0, MAX_REVISION_NOTE_LENGTH - 3) + "...";
        }
        b.getRevisions().add(BookingRevision.builder()
                .booking(b)
                .roundNo(nextRound)
                .actorRole(actorRole)
                .actorName(actorName)
                .actionLabel(actionLabel)
                .note(safeNote)
                .totalPrice(totalPrice)
                .createdAt(now)
                .build());
    }

    private record ResolvedStep(String noteType, long pricePerPerson, String originalTitle, long originalPricePerPerson) {}

    private record PriceLookup(
            Map<String, Long> previouslyQuotedPrices,
            Set<String> previousGuideOrAltTitles,
            Set<String> previousPresetTitles,
            Map<String, Long> previousOriginalPrices,
            Map<String, Long> tourStepPrices,
            Map<String, Long> presetOptionPrices
    ) {
        Long lookupOriginalPrice(String title) {
            Long p = previousOriginalPrices.get(title);
            if (p != null) return p;
            p = tourStepPrices.get(title);
            if (p != null) return p;
            return presetOptionPrices.get(title);
        }

        Long lookupCustomerPrice(String title) {
            Long p = previouslyQuotedPrices.get(title);
            if (p != null) return p;
            return lookupOriginalPrice(title);
        }
    }

    private PriceLookup buildPriceLookup(Booking b, List<BookingStep> previousSteps) {
        Map<String, Long> prevQuoted = new HashMap<>();
        Set<String> prevGuideOrAlt = new HashSet<>();
        Set<String> prevPreset = new HashSet<>();
        Map<String, Long> prevOrig = new HashMap<>();

        if (previousSteps != null) {
            for (BookingStep ps : previousSteps) {
                String t = trim(ps.getTitle());
                String nt = ps.getNoteType();
                if (t != null) {
                    if (!"REMOVED".equals(nt) && !"CUSTOM".equals(nt) && ps.getPricePerPerson() != null) {
                        prevQuoted.putIfAbsent(t, Math.max(0L, ps.getPricePerPerson()));
                    }
                    if ("GUIDE".equals(nt) || "ALTERNATIVE".equals(nt)) {
                        prevGuideOrAlt.add(t);
                    }
                    if ("PRESET".equals(nt)) {
                        prevPreset.add(t);
                    }
                }
                String origT = trim(ps.getOriginalTitle());
                if (origT != null && ps.getOriginalPricePerPerson() != null) {
                    prevOrig.putIfAbsent(origT, Math.max(0L, ps.getOriginalPricePerPerson()));
                }
            }
        }

        Map<String, Long> tourPrices = new HashMap<>();
        for (TourStep ts : b.getTour().getSteps()) {
            String t = trim(ts.getTitle());
            if (t != null && ts.getPricePerPerson() != null) {
                tourPrices.putIfAbsent(t, Math.max(0L, ts.getPricePerPerson()));
            }
        }

        Map<String, Long> optionPrices = new HashMap<>();
        if (b.getTour().getRegion() != null) {
            for (PresetOption po : presetOptionRepository.findByRegionIdOrderByIdAsc(b.getTour().getRegion().getId())) {
                String t = trim(po.getTitle());
                if (t != null && po.getPricePerPerson() != null) {
                    optionPrices.putIfAbsent(t, Math.max(0L, po.getPricePerPerson()));
                }
            }
        }

        return new PriceLookup(prevQuoted, prevGuideOrAlt, prevPreset, prevOrig, tourPrices, optionPrices);
    }

    private void applySteps(Booking b,
                            List<BookingStepRequest> inputs,
                            int days,
                            int guests,
                            long groupAdjustment,
                            Role actorRole,
                            List<BookingStep> previousSteps) {
        if (inputs == null || inputs.isEmpty()) {
            throw new BadRequestException("Lịch trình phải có ít nhất 1 hoạt động");
        }
        int maxDayInSteps = inputs.stream()
                .filter(s -> s != null && s.title() != null && !s.title().isBlank())
                .mapToInt(BookingStepRequest::dayNumber)
                .max()
                .orElse(days);
        int effectiveDays = Math.min(10, Math.max(1, Math.max(days, maxDayInSteps)));

        PriceLookup lookup = buildPriceLookup(b, previousSteps);

        b.setDays(effectiveDays);
        b.setGuests(guests);
        b.setGroupAdjustment(groupAdjustment);
        b.getSteps().clear();

        long sumPerPerson = 0;
        int activeCount = 0;
        int order = 1;

        for (BookingStepRequest s : inputs) {
            if (s == null || s.title() == null || s.title().isBlank()) continue;
            if (s.dayNumber() < 1 || s.dayNumber() > effectiveDays) continue;
            if (s.pricePerPerson() < 0 || s.pricePerPerson() > 500_000_000L) {
                throw new BadRequestException("Đơn giá hạng mục phải từ 0đ đến 500.000.000đ");
            }

            String title = s.title().trim();
            String rawNoteType = (s.noteType() == null || s.noteType().isBlank())
                    ? "PRESET"
                    : s.noteType().trim().toUpperCase();

            ResolvedStep resolved = (actorRole == Role.GUIDE)
                    ? resolveGuideStep(s, title, rawNoteType, lookup)
                    : resolveCustomerStep(s, title, rawNoteType, lookup);

            if (!"REMOVED".equals(resolved.noteType())) {
                activeCount++;
            }
            sumPerPerson += resolved.pricePerPerson();

            b.getSteps().add(BookingStep.builder()
                    .booking(b)
                    .dayNumber(s.dayNumber())
                    .category(s.category() == null || s.category().isBlank() ? "Hoạt động" : s.category().trim())
                    .title(title)
                    .imageUrl(s.imageUrl() != null && !s.imageUrl().isBlank() ? s.imageUrl().trim() : null)
                    .pricePerPerson(resolved.pricePerPerson())
                    .originalTitle(resolved.originalTitle())
                    .originalPricePerPerson(resolved.originalPricePerPerson())
                    .noteType(resolved.noteType())
                    .sortOrder(order++)
                    .build());
        }

        if (b.getSteps().isEmpty()) {
            throw new BadRequestException("Lịch trình phải có ít nhất 1 hoạt động");
        }
        if (activeCount == 0) {
            throw new BadRequestException("Lịch trình phải có ít nhất 1 hoạt động chưa bị hủy bỏ");
        }

        long rawTotal = (sumPerPerson * guests) + groupAdjustment;
        if (actorRole == Role.GUIDE && rawTotal < 0) {
            throw new BadRequestException("Tổng tiền sau điều chỉnh không được nhỏ hơn 0đ");
        }

        b.setCurrentPricePerPerson(sumPerPerson);
        b.setTotalPrice(Math.max(0L, rawTotal));
    }

    private ResolvedStep resolveCustomerStep(BookingStepRequest s, String title, String rawNoteType, PriceLookup lookup) {
        String candOrig = trim(s.originalTitle());
        Long candOrigPrice = candOrig != null ? lookup.lookupOriginalPrice(candOrig) : null;
        String verifiedOrigTitle = candOrigPrice != null ? candOrig : null;
        long verifiedOrigPrice = candOrigPrice != null ? candOrigPrice : 0L;

        if ("REMOVED".equals(rawNoteType)) {
            return new ResolvedStep("REMOVED", 0L, verifiedOrigTitle, verifiedOrigPrice);
        }
        if ("CUSTOM".equals(rawNoteType)) {
            return new ResolvedStep("CUSTOM", 0L, null, 0L);
        }

        Long verifiedPrice = lookup.lookupCustomerPrice(title);
        if (verifiedPrice == null) {
            // Unknown title from customer: treat as unpriced custom request
            return new ResolvedStep("CUSTOM", 0L, null, 0L);
        }

        if (("GUIDE".equals(rawNoteType) || "ALTERNATIVE".equals(rawNoteType))
                && lookup.previousGuideOrAltTitles().contains(title)) {
            return new ResolvedStep(rawNoteType, verifiedPrice, verifiedOrigTitle, verifiedOrigPrice);
        }

        boolean isOriginalTourStep = lookup.previousPresetTitles().contains(title)
                || lookup.previousOriginalPrices().containsKey(title)
                || lookup.tourStepPrices().containsKey(title);
        if ("PRESET".equals(rawNoteType) && isOriginalTourStep) {
            if (verifiedOrigTitle == null) {
                verifiedOrigTitle = title;
                Long origP = lookup.lookupOriginalPrice(title);
                verifiedOrigPrice = origP != null ? origP : verifiedPrice;
            }
            return new ResolvedStep("PRESET", verifiedPrice, verifiedOrigTitle, verifiedOrigPrice);
        }

        return new ResolvedStep("MODIFIED", verifiedPrice, verifiedOrigTitle, verifiedOrigPrice);
    }

    private ResolvedStep resolveGuideStep(BookingStepRequest s, String title, String rawNoteType, PriceLookup lookup) {
        boolean isRemoved = "REMOVED".equals(rawNoteType);
        long price = isRemoved ? 0L : Math.max(0L, s.pricePerPerson());
        String noteType = rawNoteType;

        if ("CUSTOM".equals(noteType)) {
            if (price > 0) {
                noteType = "GUIDE";
            } else {
                throw new BadRequestException("Vui lòng nhập đơn giá (> 0đ) cho yêu cầu thêm: " + title);
            }
        }

        String candOrig = trim(s.originalTitle());
        long origPrice = 0L;
        if (candOrig != null) {
            Long verifiedOrig = lookup.lookupOriginalPrice(candOrig);
            if (verifiedOrig != null) {
                origPrice = verifiedOrig;
            } else if (s.originalPricePerPerson() != null) {
                origPrice = Math.max(0L, s.originalPricePerPerson());
            }
        } else if (s.originalPricePerPerson() != null) {
            origPrice = Math.max(0L, s.originalPricePerPerson());
        }

        return new ResolvedStep(noteType, price, candOrig, origPrice);
    }

    private boolean isPureAlternativeAcceptance(BookingStatus prevStatus,
                                                int prevDays,
                                                int prevGuests,
                                                LocalDate prevStartDate,
                                                String prevServiceMode,
                                                List<BookingStep> previousSteps,
                                                Booking current) {
        if (prevStatus != BookingStatus.REQUOTED) return false;
        if (!Objects.equals(prevDays, current.getDays())) return false;
        if (!Objects.equals(prevGuests, current.getGuests())) return false;
        if (!Objects.equals(prevStartDate, current.getStartDate())) return false;
        String currMode = current.getServiceMode() == null ? "COMPANION" : current.getServiceMode();
        if (!Objects.equals(prevServiceMode, currMode)) return false;

        List<BookingStep> currSteps = current.getSteps();
        if (previousSteps.size() != currSteps.size()) return false;

        int convertedCount = 0;
        for (int i = 0; i < previousSteps.size(); i++) {
            BookingStep prev = previousSteps.get(i);
            BookingStep curr = currSteps.get(i);
            if (!Objects.equals(prev.getDayNumber(), curr.getDayNumber())) return false;
            if (!Objects.equals(trim(prev.getTitle()), trim(curr.getTitle()))) return false;
            if (!Objects.equals(prev.getPricePerPerson(), curr.getPricePerPerson())) return false;

            if ("ALTERNATIVE".equals(prev.getNoteType()) && "GUIDE".equals(curr.getNoteType())) {
                convertedCount++;
            } else if (!Objects.equals(prev.getNoteType(), curr.getNoteType())) {
                return false;
            }
        }
        return convertedCount > 0;
    }

    public void ensureNoCompanionOverlap(Long guideId, LocalDate startDate, int days, Long excludeBookingId, String serviceMode) {
        if (guideId == null || startDate == null) return;
        String mode = serviceMode == null || serviceMode.isBlank() ? "COMPANION" : serviceMode;
        if (!"COMPANION".equalsIgnoreCase(mode)) return;

        LocalDate startA = startDate;
        LocalDate endA = startDate.plusDays(Math.max(1, days) - 1L);
        List<Booking> active = bookingRepository.findActiveCompanionBookingsByGuide(guideId);
        for (Booking other : active) {
            if (excludeBookingId != null && excludeBookingId.equals(other.getId())) continue;
            if (other.getStartDate() == null) continue;
            LocalDate startB = other.getStartDate();
            LocalDate endB = other.getStartDate().plusDays(Math.max(1, other.getDays() == null ? 1 : other.getDays()) - 1L);
            if (!endA.isBefore(startB) && !endB.isBefore(startA)) {
                throw new BadRequestException(
                        "Hướng dẫn viên đã có lịch đi cùng đoàn khác trùng thời gian (" + startB + " → " + endB + ")");
            }
        }
    }

    private static int[] resolveGuestCounts(Integer reqGuests, Integer reqAdults, Integer reqChildren, int fallbackGuests) {
        if (reqAdults != null || reqChildren != null) {
            int adults = reqAdults != null ? Math.max(0, reqAdults) : 0;
            int children = reqChildren != null ? Math.max(0, reqChildren) : 0;
            if (adults < 1) {
                throw new BadRequestException("Phải có ít nhất 1 người lớn tham gia chuyến đi");
            }
            int total = adults + children;
            return new int[]{total, adults, children};
        }
        int total = reqGuests != null ? reqGuests : fallbackGuests;
        return new int[]{total, total, 0};
    }

    private record ConfirmedSnapshot(
            LocalDate startDate,
            int days,
            int guests,
            Integer adults,
            Integer children,
            String serviceMode,
            long groupAdjustment,
            long totalPrice,
            List<BookingStepRequest> steps
    ) {}

    private String serializeConfirmedSnapshot(Booking b) {
        List<BookingStepRequest> stepSnapshots = b.getSteps().stream()
                .map(s -> new BookingStepRequest(
                        s.getDayNumber(),
                        s.getCategory(),
                        s.getTitle(),
                        s.getPricePerPerson() == null ? 0L : s.getPricePerPerson(),
                        s.getOriginalTitle(),
                        s.getOriginalPricePerPerson(),
                        s.getNoteType(),
                        s.getImageUrl()
                ))
                .toList();
        ConfirmedSnapshot snap = new ConfirmedSnapshot(
                b.getStartDate(),
                b.getDays(),
                b.getGuests(),
                b.getAdults(),
                b.getChildren(),
                b.getServiceMode() == null ? "COMPANION" : b.getServiceMode(),
                b.getGroupAdjustment() == null ? 0L : b.getGroupAdjustment(),
                b.getTotalPrice() == null ? 0L : b.getTotalPrice(),
                stepSnapshots
        );
        try {
            return objectMapper.writeValueAsString(snap);
        } catch (Exception e) {
            throw new IllegalStateException("Không thể lưu snapshot đơn đã chốt", e);
        }
    }

    private ConfirmedSnapshot deserializeConfirmedSnapshot(String json) {
        try {
            return objectMapper.readValue(json, ConfirmedSnapshot.class);
        } catch (Exception e) {
            throw new IllegalStateException("Không thể đọc snapshot đơn đã chốt", e);
        }
    }

    private static void validateDays(int days) {
        if (days < 1 || days > 10) {
            throw new BadRequestException("Số ngày của chuyến đi phải từ 1 đến 10");
        }
    }

    private static void validateGuests(int guests) {
        if (guests < 1 || guests > 30) {
            throw new BadRequestException("Số lượng khách phải từ 1 đến 30 người");
        }
    }

    private static String summarizeCreate(Booking b) {
        long modCount = b.getSteps().stream().filter(s -> "MODIFIED".equals(s.getNoteType())).count();
        long customCount = b.getSteps().stream().filter(s -> "CUSTOM".equals(s.getNoteType())).count();
        long removedCount = b.getSteps().stream().filter(s -> "REMOVED".equals(s.getNoteType())).count();
        if (modCount == 0 && customCount == 0 && removedCount == 0) {
            return "Đặt lịch trình chuẩn (" + b.getDays() + " ngày · " + b.getGuests() + " khách).";
        }
        return "Đặt tour tuỳ chỉnh (" + b.getDays() + " ngày · " + b.getGuests() + " khách): "
                + modCount + " đổi, " + customCount + " thêm mới, " + removedCount + " bỏ.";
    }

    private static String summarizeCustomerChange(int prevDays, int prevGuests, Booking b) {
        long customCount = b.getSteps().stream().filter(s -> "CUSTOM".equals(s.getNoteType())).count();
        long modCount = b.getSteps().stream().filter(s -> "MODIFIED".equals(s.getNoteType())).count();
        long removedCount = b.getSteps().stream().filter(s -> "REMOVED".equals(s.getNoteType())).count();
        return "Cập nhật (" + prevDays + "→" + b.getDays() + " ngày, " + prevGuests + "→" + b.getGuests()
                + " khách): " + modCount + " đổi, " + customCount + " yêu cầu thêm, " + removedCount + " bỏ.";
    }

    private static String summarizeGuideRequote(Booking b) {
        long adj = b.getGroupAdjustment() == null ? 0L : b.getGroupAdjustment();
        String adjPart = adj == 0L ? "" : " (điều chỉnh đoàn " + (adj > 0 ? "+" : "") + Money.format(adj) + ")";
        return "Báo giá " + b.getDays() + " ngày · " + b.getGuests() + " khách, tổng "
                + Money.format(b.getTotalPrice()) + adjPart + ".";
    }

    private Booking find(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy đơn đặt tour ID " + id));
    }

    private static String trim(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static String trimWithMaxLength(String s, String fieldLabel, int maxLen) {
        String trimmed = trim(s);
        if (trimmed != null && trimmed.length() > maxLen) {
            throw new BadRequestException(fieldLabel + " không được vượt quá " + maxLen + " ký tự");
        }
        return trimmed;
    }

    private BookingDto toDto(Booking b) {
        TourDto tourDto = tourService.toDto(b.getTour());
        String fallbackImg = tourDto.imageUrl();
        int tourSnapVer = b.getTourVersionSnapshot() == null ? 1 : b.getTourVersionSnapshot();
        int latestVer = tourDto.version();

        return new BookingDto(
                b.getId(),
                b.getCode(),
                b.getStatus(),
                b.getStatus().getLabel(),
                b.getStatus().getStepIndex(),
                tourDto,
                b.getTourTitleSnapshot() != null ? b.getTourTitleSnapshot() : tourDto.title(),
                tourSnapVer,
                latestVer,
                UserDto.from(b.getCustomer()),
                UserDto.from(b.getGuide()),
                b.getStartDate(),
                b.getDays(),
                b.getGuests(),
                b.getAdults() != null ? b.getAdults() : b.getGuests(),
                b.getChildren() != null ? b.getChildren() : 0,
                b.getServiceMode() == null ? "COMPANION" : b.getServiceMode(),
                b.getCustomerNote(),
                b.getGuideNote(),
                b.getCustomerRating(),
                b.getCustomerReview(),
                b.getOriginalPricePerPerson(),
                b.getOriginalPricePerPerson() * b.getGuests(),
                b.getCurrentPricePerPerson(),
                b.getGroupAdjustment(),
                b.getTotalPrice(),
                b.getConfirmedTotalPrice(),
                Boolean.TRUE.equals(b.getGuideAccepted()),
                b.getDepositPercent() != null ? b.getDepositPercent() : 30,
                b.getDepositAmount(),
                Boolean.TRUE.equals(b.getDepositPaid()),
                b.getCancelReason(),
                b.getConfirmedSnapshotJson() != null && !b.getConfirmedSnapshotJson().isBlank(),
                b.getRevisionCount() == null ? 1 : b.getRevisionCount(),
                Boolean.TRUE.equals(b.getPostConfirmAdjustment()),
                b.getCreatedAt(),
                b.getUpdatedAt(),
                b.getSteps().stream().map(s -> BookingStepDto.from(s, fallbackImg)).toList(),
                b.getRevisions().stream()
                        .sorted(java.util.Comparator
                                .comparingInt((BookingRevision r) -> r.getRoundNo() == null ? 0 : r.getRoundNo())
                                .reversed()
                                .thenComparing(r -> r.getId() == null ? Long.MAX_VALUE : r.getId(),
                                        java.util.Comparator.reverseOrder()))
                        .map(BookingRevisionDto::from)
                        .toList()
        );
    }
}
