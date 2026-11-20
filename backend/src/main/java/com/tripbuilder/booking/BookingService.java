package com.tripbuilder.booking;

import com.tripbuilder.catalog.PresetOption;
import com.tripbuilder.catalog.PresetOptionRepository;
import com.tripbuilder.common.BadRequestException;
import com.tripbuilder.common.ForbiddenException;
import com.tripbuilder.common.Money;
import com.tripbuilder.tour.Tour;
import com.tripbuilder.tour.TourService;
import com.tripbuilder.tour.TourService.TourDto;
import com.tripbuilder.tour.TourStep;
import com.tripbuilder.user.AppUser;
import com.tripbuilder.user.Role;
import com.tripbuilder.user.UserDto;
import com.tripbuilder.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    // ===================== DTOs =====================

    public record StepInput(
            int dayNumber,
            String category,
            String title,
            long pricePerPerson,
            String originalTitle,
            Long originalPricePerPerson,
            String noteType,
            String imageUrl
    ) {}

    public record BookingStepDto(
            Long id,
            int dayNumber,
            String category,
            String title,
            String imageUrl,
            long pricePerPerson,
            String originalTitle,
            Long originalPricePerPerson,
            String noteType
    ) {
        public static BookingStepDto from(BookingStep s, String fallbackImg) {
            String img = (s.getImageUrl() != null && !s.getImageUrl().isBlank()) ? s.getImageUrl() : fallbackImg;
            return new BookingStepDto(
                    s.getId(),
                    s.getDayNumber(),
                    s.getCategory(),
                    s.getTitle(),
                    img,
                    s.getPricePerPerson(),
                    s.getOriginalTitle(),
                    s.getOriginalPricePerPerson(),
                    s.getNoteType()
            );
        }
    }

    public record BookingRevisionDto(
            Long id,
            int roundNo,
            String actorRole,
            String actorName,
            String actionLabel,
            String note,
            long totalPrice,
            LocalDateTime createdAt
    ) {
        public static BookingRevisionDto from(BookingRevision r) {
            return new BookingRevisionDto(
                    r.getId(),
                    r.getRoundNo() == null ? 1 : r.getRoundNo(),
                    r.getActorRole(),
                    r.getActorName(),
                    r.getActionLabel(),
                    r.getNote(),
                    r.getTotalPrice() == null ? 0L : r.getTotalPrice(),
                    r.getCreatedAt()
            );
        }
    }

    public record BookingDto(
            Long id,
            String code,
            BookingStatus status,
            String statusLabel,
            int stepIndex,
            TourDto tour,
            String tourTitleSnapshot,
            int tourVersionSnapshot,
            int latestTourVersion,
            UserDto customer,
            UserDto guide,
            LocalDate startDate,
            int days,
            int guests,
            String serviceMode,
            String customerNote,
            String guideNote,
            Integer customerRating,
            String customerReview,
            long originalPricePerPerson,
            long originalTotalPrice,
            long currentPricePerPerson,
            long groupAdjustment,
            long totalPrice,
            Long confirmedTotalPrice,
            int revisionCount,
            boolean postConfirmAdjustment,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<BookingStepDto> steps,
            List<BookingRevisionDto> revisions
    ) {}

    public record CreateBookingRequest(
            Long tourId,
            Long customerId,
            LocalDate startDate,
            Integer days,
            Integer guests,
            String serviceMode,
            String customerNote,
            Boolean customized,
            List<StepInput> steps
    ) {}

    public record CustomizeRequest(
            LocalDate startDate,
            Integer days,
            Integer guests,
            String serviceMode,
            String customerNote,
            List<StepInput> steps
    ) {}

    public record RequoteRequest(
            Integer days,
            Integer guests,
            Long groupAdjustment,
            String guideNote,
            List<StepInput> steps
    ) {}

    public record ReviewRequest(
            int rating,
            String review
    ) {}

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
        Tour tour = tourService.find(req.tourId() == null ? -1 : req.tourId());
        AppUser customer = userRepository.findById(req.customerId() == null ? -1 : req.customerId())
                .filter(u -> u.getRole() == Role.CUSTOMER)
                .orElseThrow(() -> new BadRequestException("Tài khoản khách hàng không hợp lệ"));

        int days = req.days() != null ? req.days() : tour.getDays();
        validateDays(days);
        int guests = req.guests() != null ? req.guests() : 2;
        validateGuests(guests);
        LocalDate start = req.startDate() != null ? req.startDate() : LocalDate.now().plusDays(14);
        if (start.isBefore(LocalDate.now())) {
            throw new BadRequestException("Ngày khởi hành không được ở trong quá khứ");
        }
        String mode = "REMOTE".equalsIgnoreCase(req.serviceMode()) ? "REMOTE" : "COMPANION";
        LocalDateTime now = LocalDateTime.now();
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
                .serviceMode(mode)
                .customerNote(trim(req.customerNote()))
                .originalPricePerPerson(tour.getBasePricePerPerson())
                .currentPricePerPerson(tour.getBasePricePerPerson())
                .groupAdjustment(0L)
                .totalPrice(tour.getBasePricePerPerson() * guests)
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
        Booking b = find(id);
        if (actingCustomer != null && !b.getCustomer().getId().equals(actingCustomer.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể chỉnh sửa đơn đặt tour của chính mình");
        }
        if (b.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đã huỷ không thể chỉnh sửa");
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
        int guests = req.guests() != null ? req.guests() : b.getGuests();
        validateGuests(guests);
        if (req.startDate() != null && !req.startDate().equals(b.getStartDate())) {
            if (req.startDate().isBefore(LocalDate.now())) {
                throw new BadRequestException("Ngày khởi hành mới không được ở trong quá khứ");
            }
            b.setStartDate(req.startDate());
        }
        if (req.serviceMode() != null && !req.serviceMode().isBlank()) {
            b.setServiceMode("REMOTE".equalsIgnoreCase(req.serviceMode()) ? "REMOTE" : "COMPANION");
        }
        b.setCustomerNote(trim(req.customerNote()));

        List<BookingStep> previousSteps = new ArrayList<>(b.getSteps());
        long currentGroupAdj = b.getGroupAdjustment() != null ? b.getGroupAdjustment() : 0L;
        applySteps(b, req.steps(), days, guests, currentGroupAdj, Role.CUSTOMER, previousSteps);

        boolean isPureAlternativeAcceptance = isPureAlternativeAcceptance(
                prevStatus, prevDays, prevGuests, prevStartDate, prevServiceMode, previousSteps, b);

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
        return toDto(b);
    }

    /** Khách đánh giá Tour Guide sau chuyến đi (chỉ khi đơn đã CONFIRMED). */
    @Transactional
    public BookingDto review(Long id, ReviewRequest req, AppUser actingCustomer) {
        Booking b = find(id);
        if (actingCustomer != null && !b.getCustomer().getId().equals(actingCustomer.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể đánh giá đơn của chính mình");
        }
        if (b.getStatus() != BookingStatus.CONFIRMED) {
            throw new BadRequestException("Chỉ có thể đánh giá sau khi chuyến đi đã được chốt");
        }
        if (req == null) {
            throw new BadRequestException("Vui lòng chọn số sao đánh giá");
        }
        int rating = Math.max(1, Math.min(5, req.rating()));
        b.setCustomerRating(rating);
        b.setCustomerReview(trim(req.review()));
        b.setUpdatedAt(LocalDateTime.now());
        bookingRepository.flush();
        return toDto(b);
    }

    /**
     * Tour Guide kiểm tra & gửi Báo giá lại (hỗ trợ cả điều chỉnh đơn đã CONFIRMED).
     */
    @Transactional
    public BookingDto requote(Long id, RequoteRequest req, AppUser actingGuide) {
        Booking b = find(id);
        if (actingGuide != null && !b.getGuide().getId().equals(actingGuide.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể báo giá cho đơn thuộc tour của mình");
        }
        if (b.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đã huỷ không thể báo giá");
        }

        BookingStatus prevStatus = b.getStatus();
        if (prevStatus == BookingStatus.CONFIRMED) {
            if (b.getConfirmedTotalPrice() == null) {
                b.setConfirmedTotalPrice(b.getTotalPrice());
            }
            b.setPostConfirmAdjustment(true);
        }

        int days = req.days() != null ? req.days() : b.getDays();
        validateDays(days);
        int guests = req.guests() != null ? req.guests() : b.getGuests();
        validateGuests(guests);
        long groupAdjustment = req.groupAdjustment() != null
                ? req.groupAdjustment()
                : (b.getGroupAdjustment() != null ? b.getGroupAdjustment() : 0L);
        b.setGuideNote(trim(req.guideNote()));

        List<BookingStep> previousSteps = new ArrayList<>(b.getSteps());
        applySteps(b, req.steps(), days, guests, groupAdjustment, Role.GUIDE, previousSteps);
        b.setStatus(BookingStatus.REQUOTED);

        LocalDateTime now = LocalDateTime.now();
        b.setUpdatedAt(now);
        String actionLabel = Boolean.TRUE.equals(b.getPostConfirmAdjustment())
                ? "Guide gửi báo giá điều chỉnh"
                : "Guide gửi báo giá";
        String revNote = b.getGuideNote() != null ? b.getGuideNote() : summarizeGuideRequote(b);
        addRevision(b, "GUIDE", b.getGuide().getFullName(), actionLabel, revNote, b.getTotalPrice(), now);
        bookingRepository.flush();
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
        if (b.getStatus() == BookingStatus.CONFIRMED) {
            throw new BadRequestException("Đơn này đã được chốt trước đó");
        }

        if (b.getStatus() == BookingStatus.BOOKED_ORIGINAL) {
            boolean purePreset = !b.getSteps().isEmpty()
                    && b.getSteps().stream().allMatch(s -> "PRESET".equals(s.getNoteType()))
                    && Objects.equals(b.getCurrentPricePerPerson(), b.getOriginalPricePerPerson());
            if (!purePreset) {
                throw new BadRequestException("Đơn có tuỳ chỉnh cần được Tour Guide báo giá trước khi chốt");
            }
        } else if (b.getStatus() == BookingStatus.REQUOTED) {
            boolean hasUnpricedStep = b.getSteps().stream()
                    .anyMatch(s -> "CUSTOM".equals(s.getNoteType())
                            || (!"REMOVED".equals(s.getNoteType()) && s.getPricePerPerson() == null));
            if (hasUnpricedStep) {
                throw new BadRequestException("Còn mục yêu cầu thêm chưa được Guide báo giá.");
            }
        } else {
            throw new BadRequestException("Đơn đang chờ Tour Guide báo giá, chưa thể chốt chuyến");
        }

        LocalDateTime now = LocalDateTime.now();
        b.setStatus(BookingStatus.CONFIRMED);
        b.setConfirmedTotalPrice(b.getTotalPrice());
        b.setPostConfirmAdjustment(false);
        b.setUpdatedAt(now);
        String revNote = "Chốt lịch trình " + b.getDays() + " ngày · " + b.getGuests()
                + " khách, tổng " + Money.format(b.getTotalPrice()) + ".";
        addRevision(b, "CUSTOMER", b.getCustomer().getFullName(), "Khách đồng ý chốt chuyến", revNote, b.getTotalPrice(), now);
        return toDto(b);
    }

    @Transactional
    public BookingDto cancel(Long id, AppUser actingUser) {
        Booking b = find(id);
        if (actingUser != null && !canView(b, actingUser)) {
            throw new ForbiddenException("Bạn không có quyền huỷ đơn này");
        }
        if (b.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đặt tour này đã được huỷ trước đó");
        }
        BookingStatus prevStatus = b.getStatus();
        LocalDateTime now = LocalDateTime.now();
        b.setStatus(BookingStatus.CANCELLED);
        b.setUpdatedAt(now);
        String actorRole = actingUser != null ? actingUser.getRole().name() : "CUSTOMER";
        String actorName = actingUser != null ? actingUser.getFullName() : b.getCustomer().getFullName();
        String revNote = "Huỷ đơn từ trạng thái \"" + prevStatus.getLabel() + "\".";
        addRevision(b, actorRole, actorName, "Huỷ đơn đặt tour", revNote, b.getTotalPrice(), now);
        return toDto(b);
    }

    // Overload convenience for internal seeder
    @Transactional
    public BookingDto requote(Long id, RequoteRequest req) {
        return requote(id, req, null);
    }

    @Transactional
    public BookingDto confirm(Long id) {
        return confirm(id, null);
    }

    @Transactional
    public BookingDto review(Long id, ReviewRequest req) {
        return review(id, req, null);
    }

    // ===================== Helpers =====================

    private boolean canView(Booking b, AppUser user) {
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
                            List<StepInput> inputs,
                            int days,
                            int guests,
                            long groupAdjustment,
                            Role actorRole,
                            List<BookingStep> previousSteps) {
        if (inputs == null || inputs.isEmpty()) {
            throw new BadRequestException("Lịch trình phải có ít nhất 1 hoạt động");
        }
        int maxDayInSteps = inputs.stream()
                .filter(s -> s.title() != null && !s.title().isBlank())
                .mapToInt(StepInput::dayNumber)
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

        for (StepInput s : inputs) {
            if (s.title() == null || s.title().isBlank()) continue;
            if (s.dayNumber() < 1 || s.dayNumber() > effectiveDays) continue;

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

    private ResolvedStep resolveCustomerStep(StepInput s, String title, String rawNoteType, PriceLookup lookup) {
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

    private ResolvedStep resolveGuideStep(StepInput s, String title, String rawNoteType, PriceLookup lookup) {
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
