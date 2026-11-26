package com.tripbuilder.service.guide;

import com.tripbuilder.dto.request.admin.ApproveGuideApplicationRequest;
import com.tripbuilder.dto.request.admin.RejectGuideApplicationRequest;
import com.tripbuilder.dto.request.guide.CreateGuideApplicationRequest;
import com.tripbuilder.dto.request.guide.LookupGuideApplicationRequest;
import com.tripbuilder.dto.response.guide.GuideApplicationDto;
import com.tripbuilder.dto.response.guide.GuideApplicationStatusDto;
import com.tripbuilder.entity.guide.GuideApplication;
import com.tripbuilder.entity.guide.GuideApplicationStatus;
import com.tripbuilder.entity.region.Region;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.exception.BadRequestException;
import com.tripbuilder.repository.GuideApplicationRepository;
import com.tripbuilder.repository.RegionRepository;
import com.tripbuilder.repository.UserRepository;
import com.tripbuilder.service.auth.AuthService;
import com.tripbuilder.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GuideApplicationService {

    private static final String CODE_CHARS = "0123456789ABCDEFGHJKLMNPQRSTUVWXYZ";
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final GuideApplicationRepository guideApplicationRepository;
    private final UserRepository userRepository;
    private final RegionRepository regionRepository;
    private final NotificationService notificationService;

    @Transactional
    public GuideApplicationStatusDto submit(CreateGuideApplicationRequest req) {
        if (req == null) {
            throw new BadRequestException("Vui lòng nhập đầy đủ thông tin hồ sơ đăng ký");
        }

        String fullName = AuthService.validateFullName(req.fullName());
        String email = AuthService.validateEmail(req.email());
        String phone = AuthService.validatePhone(req.phone());
        AuthService.validateStrongPassword(req.password(), req.confirmPassword());

        if (!Boolean.TRUE.equals(req.acceptedTerms())) {
            throw new BadRequestException("Vui lòng đồng ý với điều khoản đối tác Hướng dẫn viên");
        }
        if (req.regionId() == null) {
            throw new BadRequestException("Vui lòng chọn vùng hoạt động chính");
        }
        Region region = regionRepository.findById(req.regionId())
                .orElseThrow(() -> new BadRequestException("Không tìm thấy khu vực ID " + req.regionId()));

        String bio = req.bio() == null ? "" : req.bio().trim();
        if (bio.length() < 20 || bio.length() > 1000) {
            throw new BadRequestException("Giới thiệu chuyên môn & hiểu biết bản địa phải từ 20 đến 1000 ký tự");
        }

        String licenseNumber = trimOptional(req.licenseNumber(), 60, "Số thẻ HDV / CCCD không được vượt quá 60 ký tự");
        String languages = trimOptional(req.languages(), 200, "Ngôn ngữ dẫn tour không được vượt quá 200 ký tự");
        Integer years = req.yearsExperience() != null
                ? Math.max(0, Math.min(60, req.yearsExperience()))
                : null;

        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BadRequestException("Email này đã tồn tại tài khoản trên hệ thống. Vui lòng sử dụng email khác cho tài khoản Hướng dẫn viên.");
        }
        if (guideApplicationRepository.existsByEmailIgnoreCaseAndStatus(email, GuideApplicationStatus.PENDING)) {
            throw new BadRequestException("Email này đang có hồ sơ đăng ký Hướng dẫn viên chờ xét duyệt.");
        }

        GuideApplication saved = guideApplicationRepository.save(GuideApplication.builder()
                .applicationCode(generateUniqueCode())
                .fullName(fullName)
                .email(email)
                .phone(phone)
                .passwordHash(AuthService.hashPassword(req.password()))
                .region(region)
                .yearsExperience(years)
                .licenseNumber(licenseNumber)
                .languages(languages)
                .bio(bio)
                .status(GuideApplicationStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build());

        List<AppUser> admins = userRepository.findByRoleOrderByIdAsc(Role.ADMIN);
        for (AppUser admin : admins) {
            notificationService.notify(
                    admin,
                    "GUIDE_APPLICATION",
                    "Hồ sơ đăng ký HDV mới: " + saved.getFullName(),
                    saved.getApplicationCode() + " · Vùng " + region.getName() + " đang chờ xét duyệt.",
                    null
            );
        }

        return GuideApplicationStatusDto.from(saved);
    }

    @Transactional(readOnly = true)
    public GuideApplicationStatusDto lookup(LookupGuideApplicationRequest req) {
        if (req == null || req.email() == null || req.email().isBlank()
                || req.applicationCode() == null || req.applicationCode().isBlank()) {
            throw new BadRequestException("Vui lòng nhập đầy đủ email và mã hồ sơ");
        }
        GuideApplication app = guideApplicationRepository
                .findByEmailIgnoreCaseAndApplicationCodeIgnoreCase(
                        req.email().trim(),
                        req.applicationCode().trim()
                )
                .orElseThrow(() -> new BadRequestException("Không tìm thấy hồ sơ khớp với email và mã hồ sơ đã nhập"));
        return GuideApplicationStatusDto.from(app);
    }

    @Transactional(readOnly = true)
    public List<GuideApplicationDto> listForAdmin(GuideApplicationStatus status) {
        List<GuideApplication> apps = (status == null)
                ? guideApplicationRepository.findAllByOrderByCreatedAtDescIdDesc()
                : guideApplicationRepository.findByStatusOrderByCreatedAtDescIdDesc(status);
        return apps.stream().map(GuideApplicationDto::from).toList();
    }

    @Transactional
    public GuideApplicationDto approve(Long id, ApproveGuideApplicationRequest req, AppUser admin) {
        GuideApplication app = guideApplicationRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy hồ sơ đăng ký ID " + id));
        if (app.getStatus() != GuideApplicationStatus.PENDING) {
            throw new BadRequestException("Hồ sơ này đã được xử lý trước đó");
        }
        if (userRepository.findByEmailIgnoreCase(app.getEmail()).isPresent()) {
            throw new BadRequestException("Email của hồ sơ đã tồn tại tài khoản trên hệ thống");
        }

        Region targetRegion = app.getRegion();
        if (req != null && req.regionId() != null) {
            targetRegion = regionRepository.findById(req.regionId())
                    .orElseThrow(() -> new BadRequestException("Không tìm thấy khu vực ID " + req.regionId()));
        }

        String reviewNote = trimOptional(
                req != null ? req.reviewNote() : null,
                500,
                "Ghi chú xét duyệt không được vượt quá 500 ký tự"
        );

        String userBio = app.getBio();
        if (userBio != null && userBio.length() > 500) {
            userBio = userBio.substring(0, 497) + "...";
        }

        AppUser savedUser = userRepository.save(AppUser.builder()
                .fullName(app.getFullName())
                .email(app.getEmail())
                .passwordHash(app.getPasswordHash())
                .phone(app.getPhone())
                .role(Role.GUIDE)
                .region(targetRegion)
                .yearsExperience(app.getYearsExperience())
                .bio(userBio)
                .avatarUrl("/images/avatars/01-guide-minh.jpg")
                .demoAccount(false)
                .build());

        app.setRegion(targetRegion);
        app.setStatus(GuideApplicationStatus.APPROVED);
        app.setReviewedBy(admin);
        app.setReviewedAt(LocalDateTime.now());
        app.setReviewNote(reviewNote);
        app.setCreatedUser(savedUser);
        guideApplicationRepository.save(app);

        notificationService.notify(
                savedUser,
                "GUIDE_APPROVED",
                "Hồ sơ Hướng dẫn viên đã được duyệt",
                "Chào mừng bạn đến với TripBuilder Studio! Tài khoản HDV vùng " + targetRegion.getName() + " đã sẵn sàng hoạt động.",
                null
        );

        return GuideApplicationDto.from(app);
    }

    @Transactional
    public GuideApplicationDto reject(Long id, RejectGuideApplicationRequest req, AppUser admin) {
        GuideApplication app = guideApplicationRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy hồ sơ đăng ký ID " + id));
        if (app.getStatus() != GuideApplicationStatus.PENDING) {
            throw new BadRequestException("Hồ sơ này đã được xử lý trước đó");
        }
        if (req == null || req.reviewNote() == null || req.reviewNote().isBlank()) {
            throw new BadRequestException("Vui lòng nhập lý do từ chối hồ sơ");
        }
        String reviewNote = req.reviewNote().trim();
        if (reviewNote.length() > 500) {
            throw new BadRequestException("Lý do từ chối không được vượt quá 500 ký tự");
        }

        app.setStatus(GuideApplicationStatus.REJECTED);
        app.setReviewNote(reviewNote);
        app.setReviewedBy(admin);
        app.setReviewedAt(LocalDateTime.now());
        guideApplicationRepository.save(app);

        return GuideApplicationDto.from(app);
    }

    private String generateUniqueCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            StringBuilder suffix = new StringBuilder(4);
            for (int i = 0; i < 4; i++) {
                suffix.append(CODE_CHARS.charAt(SECURE_RANDOM.nextInt(CODE_CHARS.length())));
            }
            String candidate = "GA-2026-" + suffix;
            if (!guideApplicationRepository.existsByApplicationCodeIgnoreCase(candidate)) {
                return candidate;
            }
        }
        return "GA-2026-" + (System.currentTimeMillis() % 100000);
    }

    private static String trimOptional(String value, int maxLen, String errorMsg) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String trimmed = value.trim();
        if (trimmed.length() > maxLen) {
            throw new BadRequestException(errorMsg);
        }
        return trimmed;
    }
}
