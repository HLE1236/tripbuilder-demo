package com.tripbuilder.auth;

import com.tripbuilder.common.BadRequestException;
import com.tripbuilder.common.ForbiddenException;
import com.tripbuilder.common.UnauthorizedException;
import com.tripbuilder.user.AppUser;
import com.tripbuilder.user.Role;
import com.tripbuilder.user.UserDto;
import com.tripbuilder.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    @Value("${app.auth.secret:tripbuilder-local-dev-secret-2026-hmac-key}")
    private String authSecret;

    private static final long TOKEN_TTL_SECONDS = 7 * 24 * 3600L;

    public record LoginRequest(String email, String password, Role expectedRole) {}

    public record AuthResponse(String token, UserDto user) {}

    public record DemoAccountDto(Long id, String fullName, Role role, String email, String avatarUrl, String regionName) {
        public static DemoAccountDto from(AppUser u) {
            return new DemoAccountDto(
                    u.getId(),
                    u.getFullName(),
                    u.getRole(),
                    u.getEmail(),
                    u.getAvatarUrl(),
                    u.getRegion() != null ? u.getRegion().getName() : null
            );
        }
    }

    public AuthResponse login(LoginRequest req) {
        if (req == null || req.email() == null || req.email().isBlank()
                || req.password() == null || req.password().isBlank()) {
            throw new BadRequestException("Vui lòng nhập đầy đủ email và mật khẩu");
        }

        AppUser user = userRepository.findByEmailIgnoreCase(req.email().trim())
                .orElseThrow(() -> new UnauthorizedException("Email hoặc mật khẩu không chính xác"));

        String expectedHash = user.getPasswordHash();
        String incomingHash = hashPassword(req.password());
        if (expectedHash == null || !MessageDigest.isEqual(
                expectedHash.getBytes(StandardCharsets.UTF_8),
                incomingHash.getBytes(StandardCharsets.UTF_8))) {
            throw new UnauthorizedException("Email hoặc mật khẩu không chính xác");
        }

        if (req.expectedRole() != null && user.getRole() != req.expectedRole()) {
            if (req.expectedRole() == Role.GUIDE) {
                throw new ForbiddenException("Tài khoản Khách hàng không có quyền vào cổng Tour Guide (:5174).");
            }
            throw new ForbiddenException("Tài khoản Tour Guide không thể đăng nhập ở cổng Khách hàng (:5173).");
        }

        String token = issueToken(user);
        return new AuthResponse(token, UserDto.from(user));
    }

    public List<DemoAccountDto> listDemoAccounts(Role role) {
        return userRepository.findByRoleOrderByIdAsc(role).stream()
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
        if (fields.length < 3) {
            throw new UnauthorizedException("Dữ liệu phiên đăng nhập bị lỗi");
        }
        long userId;
        long exp;
        try {
            userId = Long.parseLong(fields[0]);
            exp = Long.parseLong(fields[2]);
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
        return user;
    }

    public static String hashPassword(String rawPassword) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(("tb_salt_2026:" + rawPassword).getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            throw new IllegalStateException("Cannot hash password", e);
        }
    }

    private String issueToken(AppUser user) {
        long exp = Instant.now().getEpochSecond() + TOKEN_TTL_SECONDS;
        String payload = user.getId() + ":" + user.getRole().name() + ":" + exp;
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
