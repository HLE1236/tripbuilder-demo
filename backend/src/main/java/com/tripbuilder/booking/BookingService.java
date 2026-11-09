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

    public record StepInput(int dayNumber, String category, String title, long pricePerPerson, String noteType) {}

    public record BookingStepDto(Long id, int dayNumber, String category, String title, long pricePerPerson, String noteType) {
        public static BookingStepDto from(BookingStep s) {
            return new BookingStepDto(s.getId(), s.getDayNumber(), s.getCategory(), s.getTitle(), s.getPricePerPerson(), s.getNoteType());
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

    /** Request khi Khách bấm Book (có thể đã chỉnh sửa ngay lúc book hoặc giữ nguyên). */
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

    /** Request khi Khách bấm "Chỉnh sửa theo ý muốn" trên đơn đã tạo. */
    public record CustomizeRequest(
            LocalDate startDate,
            int days,
            int guests,
            String customerNote,
            List<StepInput> steps
    ) {}

    /** Request khi Tour Guide bấm "Gửi Báo giá lại" (được sửa từng dòng + giá + phụ thu/giảm giá + lời nhắn). */
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

    /** Bước 1 & 2: Khách đặt tour (nếu customized = true -> chuyển thẳng sang Chờ Guide báo giá lại). */
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
                .status(req.customized() ? BookingStatus.WAITING_REQUOTE : BookingStatus.BOOKED_ORIGINAL)
                .createdAt(now)
                .updatedAt(now)
                .build();

        if (req.steps() != null && !req.steps().isEmpty()) {
            applySteps(b, req.steps(), days, guests, 0L);
            // Nếu có bất kỳ dòng nào khác PRESET hoặc đổi số ngày hoặc có ghi chú yêu cầu -> cần báo giá lại
            boolean hasDiff = req.customized()
                    || days != tour.getDays()
                    || b.getSteps().size() != tour.getSteps().size()
                    || b.getSteps().stream().anyMatch(s -> !"PRESET".equals(s.getNoteType()));
            b.setStatus(hasDiff ? BookingStatus.WAITING_REQUOTE : BookingStatus.BOOKED_ORIGINAL);
        } else {
            int order = 1;
            for (TourStep ts : tour.getSteps()) {
                b.getSteps().add(BookingStep.builder()
                        .booking(b)
                        .dayNumber(ts.getDayNumber())
                        .category(ts.getCategory())
                        .title(ts.getTitle())
                        .pricePerPerson(ts.getPricePerPerson())
                        .noteType("PRESET")
                        .sortOrder(order++)
                        .build());
            }
        }

        b = bookingRepository.save(b);
        b.setCode(String.format("BK-%04d", b.getId()));
        return toDto(b);
    }

    /** Khách bấm "Chỉnh sửa theo ý muốn" trên đơn đã tạo -> chuyển sang WAITING_REQUOTE. */
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
        b.setStatus(BookingStatus.WAITING_REQUOTE);
        b.setUpdatedAt(LocalDateTime.now());
        bookingRepository.flush();
        return toDto(b);
    }

    /** Bước 3: Tour Guide sửa từng dòng giá / hoạt động và gửi Báo giá lại -> chuyển sang REQUOTED. */
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

    /** Bước 4: Khách đồng ý chốt Tour -> CONFIRMED. */
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
            int day = Math.max(1, Math.min(days, s.dayNumber()));
            long price = Math.max(0, s.pricePerPerson());
            sumPerPerson += price;
            b.getSteps().add(BookingStep.builder()
                    .booking(b)
                    .dayNumber(day)
                    .category(s.category() == null || s.category().isBlank() ? "Hoạt động" : s.category())
                    .title(s.title().trim())
                    .pricePerPerson(price)
                    .noteType(s.noteType() == null || s.noteType().isBlank() ? "PRESET" : s.noteType())
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
