package com.tripbuilder.service.admin;

import com.tripbuilder.dto.request.admin.CreatePresetOptionRequest;
import com.tripbuilder.dto.request.admin.CreateUserRequest;
import com.tripbuilder.dto.response.admin.AdminOverviewDto;
import com.tripbuilder.dto.response.admin.AdminPresetOptionDto;
import com.tripbuilder.dto.response.booking.BookingDto;
import com.tripbuilder.dto.response.tour.TourDto;
import com.tripbuilder.dto.response.user.UserDto;
import com.tripbuilder.entity.booking.Booking;
import com.tripbuilder.entity.booking.BookingStatus;
import com.tripbuilder.entity.catalog.PresetOption;
import com.tripbuilder.entity.region.Region;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.exception.BadRequestException;
import com.tripbuilder.repository.BookingRepository;
import com.tripbuilder.repository.PresetOptionRepository;
import com.tripbuilder.repository.RegionRepository;
import com.tripbuilder.repository.TourRepository;
import com.tripbuilder.repository.UserRepository;
import com.tripbuilder.service.auth.AuthService;
import com.tripbuilder.service.booking.BookingService;
import com.tripbuilder.service.tour.TourService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final BookingRepository bookingRepository;
    private final TourRepository tourRepository;
    private final UserRepository userRepository;
    private final RegionRepository regionRepository;
    private final PresetOptionRepository presetOptionRepository;
    private final TourService tourService;
    private final BookingService bookingService;

    @Transactional(readOnly = true)
    public AdminOverviewDto getOverview() {
        List<Booking> bookings = bookingRepository.findAll();
        long totalRevenue = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .mapToLong(b -> b.getConfirmedTotalPrice() != null ? b.getConfirmedTotalPrice() : b.getTotalPrice())
                .sum();
        long waitingRequote = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.WAITING_REQUOTE
                        || b.getStatus() == BookingStatus.CHANGE_REQUESTED)
                .count();
        long requoted = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.REQUOTED)
                .count();
        long confirmed = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .count();
        long cancelled = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED)
                .count();

        long totalCustomers = userRepository.findByRoleOrderByIdAsc(Role.CUSTOMER).size();
        long totalGuides = userRepository.findByRoleOrderByIdAsc(Role.GUIDE).size();

        return new AdminOverviewDto(
                totalRevenue,
                bookings.size(),
                waitingRequote,
                requoted,
                confirmed,
                cancelled,
                tourRepository.count(),
                totalCustomers,
                totalGuides,
                regionRepository.count(),
                presetOptionRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public List<UserDto> listUsers(Role role) {
        List<AppUser> users = (role == null)
                ? userRepository.findAll(Sort.by(Sort.Direction.ASC, "id"))
                : userRepository.findByRoleOrderByIdAsc(role);
        return users.stream().map(UserDto::from).toList();
    }

    @Transactional
    public UserDto createUser(CreateUserRequest req) {
        if (req == null || req.fullName() == null || req.fullName().isBlank()
                || req.email() == null || req.email().isBlank()
                || req.password() == null || req.password().isBlank()
                || req.role() == null) {
            throw new BadRequestException("Vui lòng nhập đầy đủ họ tên, email, mật khẩu và vai trò");
        }
        String email = req.email().trim();
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BadRequestException("Email đã được sử dụng");
        }

        Region region = null;
        if (req.role() == Role.GUIDE && req.regionId() != null) {
            region = regionRepository.findById(req.regionId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy khu vực ID " + req.regionId()));
        }

        AppUser saved = userRepository.save(AppUser.builder()
                .fullName(req.fullName().trim())
                .email(email)
                .passwordHash(AuthService.hashPassword(req.password()))
                .phone(req.phone() != null && !req.phone().isBlank() ? req.phone().trim() : null)
                .role(req.role())
                .region(region)
                .build());
        return UserDto.from(saved);
    }

    @Transactional(readOnly = true)
    public List<TourDto> listTours() {
        return tourService.list(null);
    }

    @Transactional(readOnly = true)
    public List<BookingDto> listBookings() {
        return bookingService.list(null, null);
    }

    @Transactional(readOnly = true)
    public List<AdminPresetOptionDto> listPresetOptions() {
        return presetOptionRepository.findAll(Sort.by(Sort.Direction.ASC, "id"))
                .stream()
                .map(AdminPresetOptionDto::from)
                .toList();
    }

    @Transactional
    public AdminPresetOptionDto createPresetOption(CreatePresetOptionRequest req) {
        if (req == null || req.regionId() == null
                || req.category() == null || req.category().isBlank()
                || req.title() == null || req.title().isBlank()
                || req.pricePerPerson() == null || req.pricePerPerson() < 0) {
            throw new BadRequestException("Vui lòng nhập đầy đủ khu vực, danh mục, tên dịch vụ và đơn giá hợp lệ");
        }
        Region region = regionRepository.findById(req.regionId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy khu vực ID " + req.regionId()));

        PresetOption saved = presetOptionRepository.save(PresetOption.builder()
                .region(region)
                .category(req.category().trim())
                .title(req.title().trim())
                .description(req.description() != null && !req.description().isBlank() ? req.description().trim() : null)
                .imageUrl(req.imageUrl() != null && !req.imageUrl().isBlank() ? req.imageUrl().trim() : null)
                .pricePerPerson(req.pricePerPerson())
                .build());
        return AdminPresetOptionDto.from(saved);
    }

    @Transactional
    public void deletePresetOption(Long id) {
        if (!presetOptionRepository.existsById(id)) {
            throw new BadRequestException("Không tìm thấy dịch vụ gợi ý ID " + id);
        }
        presetOptionRepository.deleteById(id);
    }
}
