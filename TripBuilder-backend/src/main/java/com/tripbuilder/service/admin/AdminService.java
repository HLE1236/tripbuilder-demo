package com.tripbuilder.service.admin;

import com.tripbuilder.dto.request.admin.CreatePresetOptionRequest;
import com.tripbuilder.dto.request.admin.CreateUserRequest;
import com.tripbuilder.dto.request.admin.ReassignGuideRequest;
import com.tripbuilder.dto.request.admin.UpdateUserRequest;
import com.tripbuilder.dto.response.admin.AdminOverviewDto;
import com.tripbuilder.dto.response.admin.AdminPresetOptionDto;
import com.tripbuilder.dto.response.booking.BookingDto;
import com.tripbuilder.dto.response.tour.TourDto;
import com.tripbuilder.dto.response.user.UserDto;
import com.tripbuilder.entity.booking.Booking;
import com.tripbuilder.entity.booking.BookingStatus;
import com.tripbuilder.entity.catalog.PresetOption;
import com.tripbuilder.entity.guide.GuideApplicationStatus;
import com.tripbuilder.entity.region.Region;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.exception.BadRequestException;
import com.tripbuilder.repository.BookingRepository;
import com.tripbuilder.repository.GuideApplicationRepository;
import com.tripbuilder.repository.NotificationRepository;
import com.tripbuilder.repository.PresetOptionRepository;
import com.tripbuilder.repository.RefreshTokenRepository;
import com.tripbuilder.repository.RegionRepository;
import com.tripbuilder.repository.SavedTourRepository;
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
import java.util.Locale;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final BookingRepository bookingRepository;
    private final TourRepository tourRepository;
    private final UserRepository userRepository;
    private final RegionRepository regionRepository;
    private final PresetOptionRepository presetOptionRepository;
    private final SavedTourRepository savedTourRepository;
    private final GuideApplicationRepository guideApplicationRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final NotificationRepository notificationRepository;
    private final TourService tourService;
    private final BookingService bookingService;

    @Transactional(readOnly = true)
    public AdminOverviewDto getOverview() {
        List<Booking> bookings = bookingRepository.findAll();
        long totalRevenue = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED)
                .mapToLong(b -> b.getConfirmedTotalPrice() != null ? b.getConfirmedTotalPrice() : b.getTotalPrice())
                .sum();
        long collectedDeposit = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || b.getStatus() == BookingStatus.COMPLETED)
                .filter(b -> Boolean.TRUE.equals(b.getDepositPaid()) && b.getDepositAmount() != null)
                .mapToLong(Booking::getDepositAmount)
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
        long completed = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED)
                .count();
        long cancelled = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED)
                .count();

        long totalCustomers = userRepository.findByRoleOrderByIdAsc(Role.CUSTOMER).size();
        long totalGuides = userRepository.findByRoleOrderByIdAsc(Role.GUIDE).size();

        return new AdminOverviewDto(
                totalRevenue,
                collectedDeposit,
                bookings.size(),
                waitingRequote,
                requoted,
                confirmed,
                completed,
                cancelled,
                tourRepository.count(),
                totalCustomers,
                totalGuides,
                regionRepository.count(),
                presetOptionRepository.count(),
                guideApplicationRepository.countByStatus(GuideApplicationStatus.PENDING)
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
        String fullName = req.fullName().trim();
        if (fullName.length() > 100) {
            throw new BadRequestException("Họ tên không được vượt quá 100 ký tự");
        }
        String email = req.email().trim();
        if (email.length() > 100 || !AuthService.isValidEmail(email)) {
            throw new BadRequestException("Định dạng email không hợp lệ");
        }
        AuthService.validateStrongPassword(req.password());
        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BadRequestException("Email đã được sử dụng");
        }

        String phone = req.phone() != null && !req.phone().isBlank()
                ? AuthService.validatePhone(req.phone())
                : null;

        Region region = null;
        if (req.role() == Role.GUIDE) {
            if (req.regionId() == null) {
                throw new BadRequestException("Tài khoản Tour Guide bắt buộc chọn vùng phụ trách");
            }
            region = regionRepository.findById(req.regionId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy khu vực ID " + req.regionId()));
        }

        String avatarUrl;
        if (req.avatarUrl() != null && !req.avatarUrl().isBlank()) {
            avatarUrl = req.avatarUrl().trim();
            if (avatarUrl.length() > 500) {
                throw new BadRequestException("Đường dẫn ảnh đại diện không được vượt quá 500 ký tự");
            }
        } else {
            avatarUrl = req.role() == Role.GUIDE ? "/images/avatars/01-guide-minh.jpg" : "/images/avatars/05-traveler-hung.jpg";
        }
        String bio = req.bio() != null && !req.bio().isBlank() ? req.bio().trim() : null;
        if (bio != null && bio.length() > 500) {
            throw new BadRequestException("Giới thiệu không được vượt quá 500 ký tự");
        }
        Integer years = req.yearsExperience() != null ? Math.max(0, Math.min(60, req.yearsExperience())) : null;

        AppUser saved = userRepository.save(AppUser.builder()
                .fullName(fullName)
                .email(email)
                .passwordHash(AuthService.hashPassword(req.password()))
                .phone(phone)
                .role(req.role())
                .region(region)
                .bio(bio)
                .yearsExperience(years)
                .avatarUrl(avatarUrl)
                .demoAccount(false)
                .build());
        return UserDto.from(saved);
    }

    @Transactional
    public UserDto updateUser(Long id, UpdateUserRequest req) {
        if (req == null || req.fullName() == null || req.fullName().isBlank()) {
            throw new BadRequestException("Vui lòng nhập họ tên hợp lệ");
        }
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản ID " + id));

        String fullName = req.fullName().trim();
        if (fullName.length() > 100) {
            throw new BadRequestException("Họ tên không được vượt quá 100 ký tự");
        }
        user.setFullName(fullName);
        user.setPhone(req.phone() != null && !req.phone().isBlank() ? AuthService.validatePhone(req.phone()) : null);

        if (user.getRole() == Role.GUIDE) {
            if (req.regionId() != null) {
                Region region = regionRepository.findById(req.regionId())
                        .orElseThrow(() -> new BadRequestException("Không tìm thấy khu vực ID " + req.regionId()));
                Long currentRegionId = user.getRegion() != null ? user.getRegion().getId() : null;
                if (!Objects.equals(currentRegionId, region.getId()) && tourRepository.existsByGuideId(user.getId())) {
                    throw new BadRequestException("Không thể đổi vùng của Guide đã có tour. Hãy ẩn/xoá tour hoặc tạo tài khoản Guide mới.");
                }
                user.setRegion(region);
            } else if (user.getRegion() == null) {
                throw new BadRequestException("Tài khoản Tour Guide bắt buộc phải có vùng phụ trách");
            }
            if (req.bio() != null) {
                String bio = req.bio().trim();
                if (bio.length() > 500) {
                    throw new BadRequestException("Giới thiệu không được vượt quá 500 ký tự");
                }
                user.setBio(bio.isEmpty() ? null : bio);
            }
            if (req.yearsExperience() != null) {
                user.setYearsExperience(Math.max(0, Math.min(60, req.yearsExperience())));
            }
        }
        return UserDto.from(userRepository.save(user));
    }

    @Transactional
    public void deleteUser(Long id, AppUser actingAdmin) {
        if (actingAdmin != null && actingAdmin.getId().equals(id)) {
            throw new BadRequestException("Không thể tự xoá tài khoản đang đăng nhập");
        }
        AppUser user = userRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản ID " + id));
        if (bookingRepository.existsByCustomerIdOrGuideId(id, id)) {
            throw new BadRequestException("Không thể xoá tài khoản đã có đơn đặt tour liên kết");
        }
        if (tourRepository.existsByGuideId(id)) {
            throw new BadRequestException("Không thể xoá Tour Guide đang sở hữu tour mẫu");
        }
        savedTourRepository.deleteByCustomerId(id);
        refreshTokenRepository.deleteByUserId(id);
        notificationRepository.deleteByRecipientId(id);
        guideApplicationRepository.clearReviewedBy(id);
        guideApplicationRepository.clearCreatedUser(id);
        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public List<TourDto> listTours() {
        return tourService.list(null);
    }

    @Transactional(readOnly = true)
    public List<TourDto> listTours(AppUser actingAdmin) {
        return tourService.list(null, null, null, null, null, null, true, actingAdmin);
    }

    @Transactional(readOnly = true)
    public List<BookingDto> listBookings() {
        return bookingService.list(null, null);
    }

    @Transactional
    public BookingDto reassignGuide(Long bookingId, ReassignGuideRequest req, AppUser actingAdmin) {
        if (req == null || req.guideId() == null) {
            throw new BadRequestException("Vui lòng chọn Tour Guide mới");
        }
        return bookingService.reassignGuide(bookingId, req.guideId(), actingAdmin);
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
        validatePresetOptionRequest(req);
        Region region = regionRepository.findById(req.regionId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy khu vực ID " + req.regionId()));

        String normalizedCategory = normalizePresetCategory(req.category());
        String title = req.title().trim();
        String description = trimOptionalPresetField(req.description(), "Mô tả dịch vụ", 500);
        String imageUrl = req.imageUrl() != null && !req.imageUrl().isBlank()
                ? trimOptionalPresetField(req.imageUrl(), "Đường dẫn ảnh dịch vụ", 500)
                : region.getImageUrl();

        PresetOption saved = presetOptionRepository.save(PresetOption.builder()
                .region(region)
                .category(normalizedCategory)
                .title(title)
                .description(description)
                .imageUrl(imageUrl)
                .pricePerPerson(req.pricePerPerson())
                .build());
        return AdminPresetOptionDto.from(saved);
    }

    @Transactional
    public AdminPresetOptionDto updatePresetOption(Long id, CreatePresetOptionRequest req) {
        validatePresetOptionRequest(req);
        PresetOption option = presetOptionRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy dịch vụ gợi ý ID " + id));
        Region region = regionRepository.findById(req.regionId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy khu vực ID " + req.regionId()));

        option.setRegion(region);
        option.setCategory(normalizePresetCategory(req.category()));
        option.setTitle(req.title().trim());
        option.setDescription(trimOptionalPresetField(req.description(), "Mô tả dịch vụ", 500));
        if (req.imageUrl() != null && !req.imageUrl().isBlank()) {
            option.setImageUrl(trimOptionalPresetField(req.imageUrl(), "Đường dẫn ảnh dịch vụ", 500));
        } else if (option.getImageUrl() == null || option.getImageUrl().isBlank()) {
            option.setImageUrl(region.getImageUrl());
        }
        option.setPricePerPerson(req.pricePerPerson());
        return AdminPresetOptionDto.from(presetOptionRepository.save(option));
    }

    private static void validatePresetOptionRequest(CreatePresetOptionRequest req) {
        if (req == null || req.regionId() == null
                || req.category() == null || req.category().isBlank()
                || req.title() == null || req.title().isBlank()
                || req.pricePerPerson() == null || req.pricePerPerson() < 0) {
            throw new BadRequestException("Vui lòng nhập đầy đủ khu vực, danh mục, tên dịch vụ và đơn giá hợp lệ");
        }
        if (req.title().trim().length() > 200) {
            throw new BadRequestException("Tên dịch vụ không được vượt quá 200 ký tự");
        }
    }

    private static String trimOptionalPresetField(String raw, String fieldLabel, int maxLength) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.length() > maxLength) {
            throw new BadRequestException(fieldLabel + " không được vượt quá " + maxLength + " ký tự");
        }
        return trimmed;
    }

    public static String normalizePresetCategory(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new BadRequestException("Danh mục dịch vụ không được để trống");
        }
        String trimmed = raw.trim();
        String upper = trimmed.toUpperCase(Locale.ROOT);
        return switch (upper) {
            case "HOTEL", "KHÁCH SẠN", "LƯU TRÚ" -> "Khách sạn";
            case "FOOD", "ĂN UỐNG", "ẨM THỰC" -> "Ăn uống";
            case "TRANSPORT", "DI CHUYỂN" -> "Di chuyển";
            case "ACTIVITY", "TRẢI NGHIỆM" -> "Trải nghiệm";
            default -> throw new BadRequestException(
                    "Danh mục dịch vụ không hợp lệ (chỉ chấp nhận: Khách sạn, Ăn uống, Di chuyển, Trải nghiệm)");
        };
    }

    @Transactional
    public void deletePresetOption(Long id) {
        if (!presetOptionRepository.existsById(id)) {
            throw new BadRequestException("Không tìm thấy dịch vụ gợi ý ID " + id);
        }
        presetOptionRepository.deleteById(id);
    }
}
