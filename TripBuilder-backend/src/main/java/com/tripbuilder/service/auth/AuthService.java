package com.tripbuilder.service.auth;

import com.tripbuilder.dto.request.auth.*;
import com.tripbuilder.dto.response.auth.AuthResponse;
import com.tripbuilder.dto.response.auth.DemoAccountDto;
import com.tripbuilder.dto.response.auth.ForgotPasswordResponse;
import com.tripbuilder.dto.response.user.UserDto;
import com.tripbuilder.entity.auth.PasswordResetOtp;
import com.tripbuilder.entity.auth.RefreshToken;
import com.tripbuilder.entity.guide.GuideApplication;
import com.tripbuilder.entity.guide.GuideApplicationStatus;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.exception.BadRequestException;
import com.tripbuilder.exception.UnauthorizedException;
import com.tripbuilder.repository.GuideApplicationRepository;
import com.tripbuilder.repository.PasswordResetOtpRepository;
import com.tripbuilder.repository.RefreshTokenRepository;
import com.tripbuilder.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$");
    private static final Pattern VN_PHONE_PATTERN =
            Pattern.compile("^(0|\\+84)[0-9]{8,10}$");

    private static final long ACCESS_TOKEN_TTL_SECONDS = 1800L; // 30 minutes
    private static final long REFRESH_TOKEN_SHORT_TTL_SECONDS = 24L * 3600L; // 24 hours
    private static final long REFRESH_TOKEN_REMEMBER_TTL_SECONDS = 30L * 24L * 3600L; // 30 days
    private static final long OTP_TTL_SECONDS = 600L; // 10 minutes
    private static final int OTP_MAX_ATTEMPTS = 5;

    private static final BCryptPasswordEncoder PASSWORD_ENCODER = new BCryptPasswordEncoder();
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private static final String DEV_FALLBACK_SECRET = "tripbuilder-local-dev-secret-2026-hmac-key";

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordResetOtpRepository passwordResetOtpRepository;
    private final GuideApplicationRepository guideApplicationRepository;
    private final Environment environment;

    @Value("${app.auth.secret:}")
    private String authSecret;

    @Value("${app.auth.expose-dev-otp:false}")
    private boolean exposeDevOtp;

    @PostConstruct
    void validateAuthConfig() {
        if (authSecret == null || authSecret.isBlank() || authSecret.length() < 32) {
            throw new IllegalStateException(
                    "app.auth.secret must be configured with at least 32 characters (set APP_AUTH_SECRET)");
        }
        if (!isDevOrTestProfile() && DEV_FALLBACK_SECRET.equals(authSecret)) {
            throw new IllegalStateException(
                    "Default dev auth secret is not allowed outside h2/dev/test profiles");
        }
    }

    private boolean isDevOrTestProfile() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> p.equalsIgnoreCase("h2")
                        || p.equalsIgnoreCase("dev")
                        || p.equalsIgnoreCase("test"));
    }

    @Transactional
    public AuthResponse login(LoginRequest req) {
        if (req == null || req.email() == null || req.email().isBlank()
                || req.password() == null || req.password().isBlank()) {
            throw new BadRequestException("Vui lòng nhập đầy đủ email và mật khẩu");
        }

        String trimmedEmail = req.email().trim();
        AppUser user = userRepository.findByEmailIgnoreCase(trimmedEmail).orElse(null);
        if (user == null) {
            if (req.expectedRole() == Role.GUIDE) {
                GuideApplication latestApp = guideApplicationRepository
                        .findFirstByEmailIgnoreCaseOrderByCreatedAtDescIdDesc(trimmedEmail)
                        .orElse(null);
                if (latestApp != null && matchesPassword(req.password(), latestApp.getPasswordHash())) {
                    if (latestApp.getStatus() == GuideApplicationStatus.PENDING) {
                        throw new UnauthorizedException(
                                "Hồ sơ đăng ký HDV (" + latestApp.getApplicationCode()
                                        + ") của bạn đang chờ Admin xét duyệt. Vui lòng quay lại sau."
                        );
                    }
                    if (latestApp.getStatus() == GuideApplicationStatus.REJECTED) {
                        String reason = latestApp.getReviewNote() != null && !latestApp.getReviewNote().isBlank()
                                ? latestApp.getReviewNote()
                                : "Không đạt yêu cầu thẩm định";
                        throw new UnauthorizedException(
                                "Hồ sơ đăng ký HDV (" + latestApp.getApplicationCode()
                                        + ") đã bị từ chối: " + reason + ". Bạn có thể nộp lại hồ sơ mới."
                        );
                    }
                }
            }
            throw new UnauthorizedException("Email hoặc mật khẩu không chính xác");
        }

        if (!matchesPassword(req.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Email hoặc mật khẩu không chính xác");
        }

        // Lazy migration from legacy SHA-256 hash to BCrypt
        if (!isBcryptHash(user.getPasswordHash())) {
            user.setPasswordHash(hashPassword(req.password()));
            userRepository.save(user);
        }

        if (req.expectedRole() != null && user.getRole() != req.expectedRole()) {
            throw new UnauthorizedException("Email hoặc mật khẩu không chính xác");
        }

        boolean rememberMe = Boolean.TRUE.equals(req.rememberMe());
        return issueAuthResponse(user, rememberMe);
    }

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        if (req == null) {
            throw new BadRequestException("Vui lòng nhập đầy đủ thông tin đăng ký");
        }

        String fullName = validateFullName(req.fullName());
        String email = validateEmail(req.email());
        String phone = validatePhone(req.phone());
        validateStrongPassword(req.password(), req.confirmPassword());

        if (!Boolean.TRUE.equals(req.acceptedTerms())) {
            throw new BadRequestException("Vui lòng đồng ý với điều khoản sử dụng");
        }

        if (userRepository.findByEmailIgnoreCase(email).isPresent()) {
            throw new BadRequestException("Email đã được sử dụng");
        }

        AppUser saved = userRepository.save(AppUser.builder()
                .fullName(fullName)
                .email(email)
                .passwordHash(hashPassword(req.password()))
                .phone(phone)
                .role(Role.CUSTOMER)
                .avatarUrl("/images/avatars/05-traveler-hung.jpg")
                .demoAccount(false)
                .build());

        return issueAuthResponse(saved, false);
    }

    @Transactional
    public AuthResponse refresh(RefreshTokenRequest req) {
        if (req == null || req.refreshToken() == null || req.refreshToken().isBlank()) {
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ");
        }

        String tokenHash = sha256Hex(req.refreshToken().trim());
        RefreshToken existing = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new UnauthorizedException("Phiên đăng nhập đã hết hạn hoặc không hợp lệ"));

        if (existing.isRevoked() || existing.getExpiresAt().isBefore(Instant.now())) {
            throw new UnauthorizedException("Phiên đăng nhập đã hết hạn hoặc không hợp lệ");
        }

        existing.setRevoked(true);
        refreshTokenRepository.save(existing);

        return issueAuthResponse(existing.getUser(), existing.isRememberMe());
    }

    @Transactional
    public void logout(LogoutRequest req) {
        logout(req, null);
    }

    @Transactional
    public void logout(LogoutRequest req, String authHeader) {
        if (req != null && req.refreshToken() != null && !req.refreshToken().isBlank()) {
            String tokenHash = sha256Hex(req.refreshToken().trim());
            refreshTokenRepository.findByTokenHash(tokenHash).ifPresent(rt -> {
                if (!rt.isRevoked()) {
                    rt.setRevoked(true);
                    refreshTokenRepository.save(rt);
                }
                bumpTokenVersion(rt.getUser());
                refreshTokenRepository.revokeAllByUserId(rt.getUser().getId());
            });
        }
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                AppUser user = authenticateHeader(authHeader);
                bumpTokenVersion(user);
                refreshTokenRepository.revokeAllByUserId(user.getId());
            } catch (UnauthorizedException ignored) {
                // Token already invalid/expired; nothing left to revoke
            }
        }
    }

    @Transactional
    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest req) {
        if (req == null || !isValidEmail(req.email())) {
            throw new BadRequestException("Định dạng email không hợp lệ");
        }
        String email = req.email().trim();

        var userOpt = userRepository.findByEmailIgnoreCase(email);
        if (userOpt.isEmpty()) {
            return new ForgotPasswordResponse(
                    "Nếu email tồn tại trong hệ thống, mã xác nhận đã được gửi.",
                    null
            );
        }

        passwordResetOtpRepository.invalidateUnusedByEmail(email);

        String otp = String.format("%06d", SECURE_RANDOM.nextInt(1_000_000));
        Instant now = Instant.now();
        passwordResetOtpRepository.save(PasswordResetOtp.builder()
                .email(email)
                .otpHash(sha256Hex(otp))
                .expiresAt(now.plusSeconds(OTP_TTL_SECONDS))
                .used(false)
                .attempts(0)
                .createdAt(now)
                .build());

        String responseDevOtp = (exposeDevOtp && isDevOrTestProfile()) ? otp : null;

        return new ForgotPasswordResponse(
                "Nếu email tồn tại trong hệ thống, mã xác nhận đã được gửi.",
                responseDevOtp
        );
    }

    @Transactional(noRollbackFor = BadRequestException.class)
    public void resetPassword(ResetPasswordRequest req) {
        if (req == null || !isValidEmail(req.email())
                || req.otp() == null || req.otp().isBlank()) {
            throw new BadRequestException("Vui lòng nhập đầy đủ email và mã xác nhận");
        }

        String email = req.email().trim();
        PasswordResetOtp otpRecord = passwordResetOtpRepository
                .findTopByEmailIgnoreCaseAndUsedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new BadRequestException("Mã xác nhận không hợp lệ hoặc đã hết hạn"));

        if (otpRecord.getExpiresAt().isBefore(Instant.now())) {
            throw new BadRequestException("Mã xác nhận không hợp lệ hoặc đã hết hạn");
        }

        if (otpRecord.getAttempts() >= OTP_MAX_ATTEMPTS) {
            throw new BadRequestException("Bạn đã nhập sai mã xác nhận quá số lần cho phép, vui lòng yêu cầu mã mới");
        }

        String incomingOtpHash = sha256Hex(req.otp().trim());
        if (!MessageDigest.isEqual(
                incomingOtpHash.getBytes(StandardCharsets.UTF_8),
                otpRecord.getOtpHash().getBytes(StandardCharsets.UTF_8))) {
            otpRecord.setAttempts(otpRecord.getAttempts() + 1);
            passwordResetOtpRepository.save(otpRecord);
            throw new BadRequestException("Mã xác nhận không chính xác");
        }

        validateStrongPassword(req.newPassword(), req.confirmPassword());

        AppUser user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new BadRequestException("Tài khoản không tồn tại"));

        user.setPasswordHash(hashPassword(req.newPassword()));
        userRepository.save(user);

        otpRecord.setUsed(true);
        passwordResetOtpRepository.save(otpRecord);

        bumpTokenVersion(user);
        refreshTokenRepository.revokeAllByUserId(user.getId());
    }

    @Transactional
    public UserDto updateProfile(AppUser currentUser, UpdateProfileRequest req) {
        if (req == null) {
            throw new BadRequestException("Dữ liệu cập nhật không hợp lệ");
        }

        String fullName = validateFullName(req.fullName());
        String phone = validatePhone(req.phone());

        if (req.avatarUrl() != null && !req.avatarUrl().isBlank()) {
            String avatarUrl = req.avatarUrl().trim();
            if (avatarUrl.length() > 500) {
                throw new BadRequestException("Đường dẫn ảnh đại diện không được vượt quá 500 ký tự");
            }
            String lower = avatarUrl.toLowerCase(java.util.Locale.ROOT);
            if (!(avatarUrl.startsWith("/") || lower.startsWith("http://") || lower.startsWith("https://"))) {
                throw new BadRequestException("Đường dẫn ảnh đại diện phải bắt đầu bằng /, http:// hoặc https://");
            }
            currentUser.setAvatarUrl(avatarUrl);
        }

        currentUser.setFullName(fullName);
        currentUser.setPhone(phone);

        AppUser saved = userRepository.save(currentUser);
        return UserDto.from(saved);
    }

    @Transactional
    public void changePassword(AppUser currentUser, ChangePasswordRequest req) {
        if (req == null || req.currentPassword() == null || req.currentPassword().isBlank()) {
            throw new BadRequestException("Vui lòng nhập mật khẩu hiện tại");
        }

        if (!matchesPassword(req.currentPassword(), currentUser.getPasswordHash())) {
            throw new BadRequestException("Mật khẩu hiện tại không chính xác");
        }

        validateStrongPassword(req.newPassword(), req.confirmPassword());

        if (req.newPassword().equals(req.currentPassword())) {
            throw new BadRequestException("Mật khẩu mới phải khác mật khẩu hiện tại");
        }

        currentUser.setPasswordHash(hashPassword(req.newPassword()));
        bumpTokenVersion(currentUser);
        refreshTokenRepository.revokeAllByUserId(currentUser.getId());
    }

    public static boolean isValidEmail(String email) {
        return email != null && EMAIL_PATTERN.matcher(email.trim()).matches();
    }

    public List<DemoAccountDto> listDemoAccounts(Role role) {
        if (role == null) {
            throw new BadRequestException("Vui lòng chọn vai trò tài khoản mẫu");
        }
        return userRepository.findByRoleAndDemoAccountTrueOrderByIdAsc(role).stream()
                .map(DemoAccountDto::from)
                .toList();
    }

    public AppUser authenticateHeader(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new UnauthorizedException("Vui lòng đăng nhập để thực hiện thao tác này");
        }
        String token = authHeader.substring("Bearer ".length()).trim();
        return verifyToken(token);
    }

    public AppUser verifyToken(String token) {
        if (token == null || token.isBlank()) {
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ");
        }
        String[] parts = token.split("\\.");
        if (parts.length != 2) {
            throw new UnauthorizedException("Token đăng nhập không hợp lệ");
        }
        String payloadB64 = parts[0];
        String sigB64 = parts[1];

        String expectedSig = sign(payloadB64);
        if (!MessageDigest.isEqual(
                sigB64.getBytes(StandardCharsets.UTF_8),
                expectedSig.getBytes(StandardCharsets.UTF_8))) {
            throw new UnauthorizedException("Chữ ký phiên đăng nhập không hợp lệ");
        }

        String payload;
        try {
            payload = new String(Base64.getUrlDecoder().decode(payloadB64), StandardCharsets.UTF_8);
        } catch (IllegalArgumentException ex) {
            throw new UnauthorizedException("Token đăng nhập không hợp lệ");
        }
        String[] fields = payload.split(":");
        if (fields.length < 4) {
            throw new UnauthorizedException("Dữ liệu phiên đăng nhập bị lỗi");
        }
        long userId;
        long exp;
        long tokenVersion;
        try {
            userId = Long.parseLong(fields[0]);
            exp = Long.parseLong(fields[2]);
            tokenVersion = Long.parseLong(fields[3]);
        } catch (NumberFormatException ex) {
            throw new UnauthorizedException("Phiên đăng nhập không hợp lệ");
        }

        if (Instant.now().getEpochSecond() > exp) {
            throw new UnauthorizedException("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại");
        }

        AppUser user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Tài khoản không còn tồn tại"));
        if (!user.getRole().name().equals(fields[1])) {
            throw new UnauthorizedException("Quyền tài khoản không khớp phiên đăng nhập");
        }
        long currentVersion = user.getTokenVersion() != null ? user.getTokenVersion() : 0L;
        if (tokenVersion != currentVersion) {
            throw new UnauthorizedException("Phiên đăng nhập đã bị thu hồi, vui lòng đăng nhập lại");
        }
        return user;
    }

    public static String hashPassword(String rawPassword) {
        return PASSWORD_ENCODER.encode(rawPassword);
    }

    private static boolean isBcryptHash(String hash) {
        return hash != null && (hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$"));
    }

    public static boolean matchesPassword(String rawPassword, String storedHash) {
        if (rawPassword == null || storedHash == null) {
            return false;
        }
        if (isBcryptHash(storedHash)) {
            return PASSWORD_ENCODER.matches(rawPassword, storedHash);
        }
        String legacyHash = sha256Hex("tb_salt_2026:" + rawPassword);
        return MessageDigest.isEqual(
                storedHash.getBytes(StandardCharsets.UTF_8),
                legacyHash.getBytes(StandardCharsets.UTF_8));
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Cannot compute SHA-256", e);
        }
    }

    public static String validateFullName(String rawFullName) {
        if (rawFullName == null || rawFullName.isBlank()) {
            throw new BadRequestException("Vui lòng nhập họ tên");
        }
        String fullName = rawFullName.trim();
        if (fullName.length() < 2 || fullName.length() > 100) {
            throw new BadRequestException("Họ tên phải có từ 2 đến 100 ký tự");
        }
        return fullName;
    }

    public static String validateEmail(String rawEmail) {
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new BadRequestException("Vui lòng nhập email");
        }
        String email = rawEmail.trim();
        if (email.length() > 100 || !isValidEmail(email)) {
            throw new BadRequestException("Định dạng email không hợp lệ");
        }
        return email;
    }

    public static String validatePhone(String rawPhone) {
        if (rawPhone == null || rawPhone.isBlank()) {
            throw new BadRequestException("Vui lòng nhập số điện thoại");
        }
        String phone = rawPhone.replaceAll("[\\s-]+", "");
        if (!VN_PHONE_PATTERN.matcher(phone).matches()) {
            throw new BadRequestException("Số điện thoại không hợp lệ (định dạng Việt Nam: 0xxx hoặc +84xxx)");
        }
        return phone;
    }

    public static void validateStrongPassword(String password) {
        if (password == null || password.length() < 8 || password.length() > 100) {
            throw new BadRequestException("Mật khẩu phải có từ 8 đến 100 ký tự");
        }
        boolean hasUpper = false;
        boolean hasLower = false;
        boolean hasDigit = false;
        for (int i = 0; i < password.length(); i++) {
            char c = password.charAt(i);
            if (Character.isUpperCase(c)) hasUpper = true;
            else if (Character.isLowerCase(c)) hasLower = true;
            else if (Character.isDigit(c)) hasDigit = true;
        }
        if (!hasUpper || !hasLower || !hasDigit) {
            throw new BadRequestException("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 chữ số");
        }
    }

    public static void validateStrongPassword(String password, String confirmPassword) {
        validateStrongPassword(password);
        if (!password.equals(confirmPassword)) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp");
        }
    }

    private AuthResponse issueAuthResponse(AppUser user, boolean rememberMe) {
        String accessToken = issueToken(user);
        String rawRefreshToken = issueRefreshToken(user, rememberMe);
        return new AuthResponse(accessToken, rawRefreshToken, ACCESS_TOKEN_TTL_SECONDS, UserDto.from(user));
    }

    private String issueRefreshToken(AppUser user, boolean rememberMe) {
        byte[] bytes = new byte[32];
        SECURE_RANDOM.nextBytes(bytes);
        String rawRefreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);

        long ttlSeconds = rememberMe ? REFRESH_TOKEN_REMEMBER_TTL_SECONDS : REFRESH_TOKEN_SHORT_TTL_SECONDS;
        Instant now = Instant.now();

        refreshTokenRepository.save(RefreshToken.builder()
                .tokenHash(sha256Hex(rawRefreshToken))
                .user(user)
                .rememberMe(rememberMe)
                .expiresAt(now.plusSeconds(ttlSeconds))
                .revoked(false)
                .createdAt(now)
                .build());

        return rawRefreshToken;
    }

    private void bumpTokenVersion(AppUser user) {
        long current = user.getTokenVersion() != null ? user.getTokenVersion() : 0L;
        user.setTokenVersion(current + 1L);
        userRepository.save(user);
    }

    private String issueToken(AppUser user) {
        long exp = Instant.now().getEpochSecond() + ACCESS_TOKEN_TTL_SECONDS;
        long ver = user.getTokenVersion() != null ? user.getTokenVersion() : 0L;
        String payload = user.getId() + ":" + user.getRole().name() + ":" + exp + ":" + ver;
        String payloadB64 = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        String sig = sign(payloadB64);
        return payloadB64 + "." + sig;
    }

    private String sign(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(authSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] raw = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot sign token", e);
        }
    }
}
