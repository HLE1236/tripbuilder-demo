package com.tripbuilder.booking;

import com.tripbuilder.common.BadRequestException;
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
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final TourService tourService;

    // ===================== DTOs =====================

    public record StepInput(
            int dayNumber,
            String category,
            String title,
            long pricePerPerson,
            String originalTitle,
            Long originalPricePerPerson,
            String noteType
    ) {}

    public record BookingStepDto(
            Long id,
            int dayNumber,
            String category,
            String title,
            long pricePerPerson,
            String originalTitle,
            Long originalPricePerPerson,
            String noteType
    ) {
        public static BookingStepDto from(BookingStep s) {
            return new BookingStepDto(
                    s.getId(),
                    s.getDayNumber(),
                    s.getCategory(),
                    s.getTitle(),
                    s.getPricePerPerson(),
                    s.getOriginalTitle(),
                    s.getOriginalPricePerPerson(),
                    s.getNoteType()
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
            UserDto customer,
            UserDto guide,
            LocalDate startDate,
            int days,
            int guests,
            String customerNote,
            String guideNote,
            long originalPricePerPerson,
            long originalTotalPrice,
            long currentPricePerPerson,
            long groupAdjustment,
            long totalPrice,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<BookingStepDto> steps
    ) {}

    public record CreateBookingRequest(
            Long tourId,
            Long customerId,
            LocalDate startDate,
            int days,
            int guests,
            String customerNote,
            boolean customized,
            List<StepInput> steps
    ) {}

    public record CustomizeRequest(
            LocalDate startDate,
            int days,
            int guests,
            String customerNote,
            List<StepInput> steps
    ) {}

    public record RequoteRequest(
            int days,
            int guests,
            long groupAdjustment,
            String guideNote,
            List<StepInput> steps
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
    public BookingDto get(Long id) {
        return toDto(find(id));
    }

    /**
     * Khách đặt tour.
     * Lưu ý theo Đề xuất 4: Nếu khách giữ nguyên 100% lịch trình và chỉ viết lời nhắn dặn dò (customerNote),
     * đơn vẫn được giữ nguyên Giá gốc (BOOKED_ORIGINAL) chứ không bị ép thành đơn thay đổi lịch trình.
     */
    @Transactional
    public BookingDto create(CreateBookingRequest req) {
        Tour tour = tourService.find(req.tourId() == null ? -1 : req.tourId());
        AppUser customer = userRepository.findById(req.customerId() == null ? -1 : req.customerId())
                .filter(u -> u.getRole() == Role.CUSTOMER)
                .orElseThrow(() -> new BadRequestException("Tài khoản khách hàng không hợp lệ"));

        int days = req.days() > 0 ? req.days() : tour.getDays();
        int guests = Math.max(1, req.guests());
        LocalDate start = req.startDate() != null ? req.startDate() : LocalDate.now().plusDays(14);

        LocalDateTime now = LocalDateTime.now();
        Booking b = Booking.builder()
                .tour(tour)
                .customer(customer)
                .guide(tour.getGuide())
                .startDate(start)
                .days(days)
                .guests(guests)
                .customerNote(trim(req.customerNote()))
                .originalPricePerPerson(tour.getBasePricePerPerson())
                .currentPricePerPerson(tour.getBasePricePerPerson())
                .groupAdjustment(0L)
                .totalPrice(tour.getBasePricePerPerson() * guests)
                .status(BookingStatus.BOOKED_ORIGINAL)
                .createdAt(now)
                .updatedAt(now)
                .build();

        if (req.steps() != null && !req.steps().isEmpty()) {
            applySteps(b, req.steps(), days, guests, 0L);
            // Chỉ chuyển sang WAITING_REQUOTE khi thực sự có thay đổi lịch trình hoặc đổi số ngày
            boolean scheduleChanged = days != tour.getDays()
                    || b.getSteps().size() != tour.getSteps().size()
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
                        .pricePerPerson(ts.getPricePerPerson())
                        .originalTitle(ts.getTitle())
                        .originalPricePerPerson(ts.getPricePerPerson())
                        .noteType("PRESET")
                        .sortOrder(order++)
                        .build());
            }
        }

        b = bookingRepository.save(b);
        b.setCode(String.format("BK-%04d", b.getId()));
        return toDto(b);
    }

    /** Khách bấm "Tuỳ chỉnh lịch trình" trên đơn đã tạo. */
    @Transactional
    public BookingDto customize(Long id, CustomizeRequest req) {
        Booking b = find(id);
        if (b.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đã huỷ không thể chỉnh sửa");
        }
        int days = Math.max(1, Math.min(10, req.days()));
        int guests = Math.max(1, req.guests());
        if (req.startDate() != null) b.setStartDate(req.startDate());
        b.setCustomerNote(trim(req.customerNote()));

        applySteps(b, req.steps(), days, guests, 0L);
        boolean scheduleChanged = days != b.getTour().getDays()
                || b.getSteps().size() != b.getTour().getSteps().size()
                || b.getSteps().stream().anyMatch(s -> !"PRESET".equals(s.getNoteType()));
        b.setStatus(scheduleChanged ? BookingStatus.WAITING_REQUOTE : BookingStatus.BOOKED_ORIGINAL);
        b.setUpdatedAt(LocalDateTime.now());
        bookingRepository.flush();
        return toDto(b);
    }

    /** Tour Guide kiểm tra & gửi Báo giá chốt. */
    @Transactional
    public BookingDto requote(Long id, RequoteRequest req) {
        Booking b = find(id);
        if (b.getStatus() == BookingStatus.CANCELLED) {
            throw new BadRequestException("Đơn đã huỷ không thể báo giá");
        }
        int days = req.days() > 0 ? req.days() : b.getDays();
        int guests = req.guests() > 0 ? req.guests() : b.getGuests();
        b.setGuideNote(trim(req.guideNote()));

        applySteps(b, req.steps(), days, guests, req.groupAdjustment());
        b.setStatus(BookingStatus.REQUOTED);
        b.setUpdatedAt(LocalDateTime.now());
        bookingRepository.flush();
        return toDto(b);
    }

    /** Khách đồng ý & Hoàn tất. */
    @Transactional
    public BookingDto confirm(Long id) {
        Booking b = find(id);
        if (b.getStatus() == BookingStatus.WAITING_REQUOTE) {
            throw new BadRequestException("Đơn đang chờ Tour Guide báo giá lại, chưa thể chốt");
        }
        b.setStatus(BookingStatus.CONFIRMED);
        b.setUpdatedAt(LocalDateTime.now());
        return toDto(b);
    }

    @Transactional
    public BookingDto cancel(Long id) {
        Booking b = find(id);
        b.setStatus(BookingStatus.CANCELLED);
        b.setUpdatedAt(LocalDateTime.now());
        return toDto(b);
    }

    // ===================== Helpers =====================

    private void applySteps(Booking b, List<StepInput> inputs, int days, int guests, long groupAdjustment) {
        if (inputs == null || inputs.isEmpty()) {
            throw new BadRequestException("Lịch trình phải có ít nhất 1 hoạt động");
        }
        b.setDays(days);
        b.setGuests(guests);
        b.setGroupAdjustment(groupAdjustment);
        b.getSteps().clear();

        long sumPerPerson = 0;
        int order = 1;
        for (StepInput s : inputs) {
            if (s.title() == null || s.title().isBlank()) continue;
            // Đề xuất 4: Chỉ giữ và tính tiền các hoạt động nằm trong số ngày đi (days)
            if (s.dayNumber() < 1 || s.dayNumber() > days) continue;

            String noteType = s.noteType() == null || s.noteType().isBlank() ? "PRESET" : s.noteType();
            boolean isRemoved = "REMOVED".equals(noteType);
            long price = isRemoved ? 0L : Math.max(0, s.pricePerPerson());
            sumPerPerson += price;

            b.getSteps().add(BookingStep.builder()
                    .booking(b)
                    .dayNumber(s.dayNumber())
                    .category(s.category() == null || s.category().isBlank() ? "Hoạt động" : s.category())
                    .title(s.title().trim())
                    .pricePerPerson(price)
                    .originalTitle(s.originalTitle())
                    .originalPricePerPerson(s.originalPricePerPerson())
                    .noteType(noteType)
                    .sortOrder(order++)
                    .build());
        }
        b.setCurrentPricePerPerson(sumPerPerson);
        long total = Math.max(0, (sumPerPerson * guests) + groupAdjustment);
        b.setTotalPrice(total);
    }

    private Booking find(Long id) {
        return bookingRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy đơn đặt tour ID " + id));
    }

    private static String trim(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private BookingDto toDto(Booking b) {
        return new BookingDto(
                b.getId(),
                b.getCode(),
                b.getStatus(),
                b.getStatus().getLabel(),
                b.getStatus().getStepIndex(),
                tourService.toDto(b.getTour()),
                UserDto.from(b.getCustomer()),
                UserDto.from(b.getGuide()),
                b.getStartDate(),
                b.getDays(),
                b.getGuests(),
                b.getCustomerNote(),
                b.getGuideNote(),
                b.getOriginalPricePerPerson(),
                b.getOriginalPricePerPerson() * b.getGuests(),
                b.getCurrentPricePerPerson(),
                b.getGroupAdjustment(),
                b.getTotalPrice(),
                b.getCreatedAt(),
                b.getUpdatedAt(),
                b.getSteps().stream().map(BookingStepDto::from).toList()
        );
    }
}
