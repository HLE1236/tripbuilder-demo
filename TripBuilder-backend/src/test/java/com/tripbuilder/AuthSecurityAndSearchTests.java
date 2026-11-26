package com.tripbuilder;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.tripbuilder.dto.request.auth.LoginRequest;
import com.tripbuilder.entity.auth.RefreshToken;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.repository.RefreshTokenRepository;
import com.tripbuilder.repository.UserRepository;
import com.tripbuilder.service.auth.AuthService;
import com.tripbuilder.util.VietnameseTextUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb_sec;MODE=MSSQLServer;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class AuthSecurityAndSearchTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void bcryptAndLazyMigrationFromLegacySha256() throws Exception {
        AppUser seeded = userRepository.findByEmailIgnoreCase("an.nguyen@gmail.com").orElseThrow();
        assertTrue(seeded.getPasswordHash().startsWith("$2a$")
                || seeded.getPasswordHash().startsWith("$2b$")
                || seeded.getPasswordHash().startsWith("$2y$"));

        String legacyEmail = "legacy.user@gmail.com";
        String legacyHash = sha256Hex("tb_salt_2026:LegacyPass123");
        userRepository.save(AppUser.builder()
                .fullName("Legacy User")
                .email(legacyEmail)
                .passwordHash(legacyHash)
                .phone("0901234567")
                .role(Role.CUSTOMER)
                .demoAccount(false)
                .build());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"legacy.user@gmail.com\",\"password\":\"LegacyPass123\",\"expectedRole\":\"CUSTOMER\",\"rememberMe\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists())
                .andExpect(jsonPath("$.data.expiresInSeconds").value(1800));

        AppUser migrated = userRepository.findByEmailIgnoreCase(legacyEmail).orElseThrow();
        assertTrue(migrated.getPasswordHash().startsWith("$2a$")
                || migrated.getPasswordHash().startsWith("$2b$")
                || migrated.getPasswordHash().startsWith("$2y$"));
        assertNotEquals(legacyHash, migrated.getPasswordHash());
    }

    @Test
    void loginRoleMismatchReturns401WithoutPortalOrPortLeaks() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"an.nguyen@gmail.com\",\"password\":\"123456\",\"expectedRole\":\"ADMIN\",\"rememberMe\":false}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Email hoặc mật khẩu không chính xác"))
                .andReturn();

        String body = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertFalse(body.contains("5173"));
        assertFalse(body.contains("5174"));
        assertFalse(body.contains("5175"));
        assertFalse(body.contains("Tour Guide"));
        assertFalse(body.contains("Admin Tổng"));
    }

    @Test
    void registerValidationEnforcesPhoneStrongPasswordConfirmAndTerms() throws Exception {
        // Missing/invalid phone -> 400
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Nguyen Van A\",\"email\":\"v1@gmail.com\",\"phone\":\"12345\",\"password\":\"StrongPass99\",\"confirmPassword\":\"StrongPass99\",\"acceptedTerms\":true}"))
                .andExpect(status().isBadRequest());

        // Weak password (no uppercase/digit) -> 400
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Nguyen Van A\",\"email\":\"v1@gmail.com\",\"phone\":\"0901234567\",\"password\":\"weakpass\",\"confirmPassword\":\"weakpass\",\"acceptedTerms\":true}"))
                .andExpect(status().isBadRequest());

        // Mismatched confirmPassword -> 400
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Nguyen Van A\",\"email\":\"v1@gmail.com\",\"phone\":\"0901234567\",\"password\":\"StrongPass99\",\"confirmPassword\":\"OtherPass99\",\"acceptedTerms\":true}"))
                .andExpect(status().isBadRequest());

        // acceptedTerms = false -> 400
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Nguyen Van A\",\"email\":\"v1@gmail.com\",\"phone\":\"0901234567\",\"password\":\"StrongPass99\",\"confirmPassword\":\"StrongPass99\",\"acceptedTerms\":false}"))
                .andExpect(status().isBadRequest());

        // Valid registration with spaces/dashes in VN phone -> 200
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Nguyen Van A\",\"email\":\"valid.reg@gmail.com\",\"phone\":\"0901 234-567\",\"password\":\"StrongPass99\",\"confirmPassword\":\"StrongPass99\",\"acceptedTerms\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists())
                .andExpect(jsonPath("$.data.expiresInSeconds").value(1800))
                .andExpect(jsonPath("$.data.user.phone").value("0901234567"))
                .andExpect(jsonPath("$.data.user.role").value("CUSTOMER"));
    }

    @Test
    void refreshTokenRotationRememberMeAndLogoutWork() throws Exception {
        // Login with rememberMe = true -> 30 days TTL
        var rememberAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, true));
        RefreshToken rtEntity = refreshTokenRepository.findByTokenHash(sha256Hex(rememberAuth.refreshToken())).orElseThrow();
        assertTrue(rtEntity.isRememberMe());
        long days = Duration.between(Instant.now(), rtEntity.getExpiresAt()).toDays();
        assertTrue(days >= 29 && days <= 30);

        // Refresh rotates token
        MvcResult refreshRes = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + rememberAuth.refreshToken() + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists())
                .andReturn();

        JsonNode data = objectMapper.readTree(refreshRes.getResponse().getContentAsString()).get("data");
        String newRefreshToken = data.get("refreshToken").asText();
        assertNotEquals(rememberAuth.refreshToken(), newRefreshToken);

        // Old refresh token is revoked -> 401
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + rememberAuth.refreshToken() + "\"}"))
                .andExpect(status().isUnauthorized());

        // Logout revokes the new refresh token
        mockMvc.perform(post("/api/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + newRefreshToken + "\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + newRefreshToken + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void forgotAndResetPasswordOtpFlowAndMaxAttempts() throws Exception {
        // Non-existent email returns 200 with null devOtp
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.devOtp").doesNotExist());

        // Create a dedicated user for reset test
        userRepository.save(AppUser.builder()
                .fullName("Reset Target")
                .email("reset.target@gmail.com")
                .passwordHash(AuthService.hashPassword("OldPass123"))
                .phone("0908765432")
                .role(Role.CUSTOMER)
                .demoAccount(false)
                .build());

        var activeSession = authService.login(new LoginRequest("reset.target@gmail.com", "OldPass123", Role.CUSTOMER, false));

        // Request OTP
        MvcResult forgotRes = mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"reset.target@gmail.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.devOtp").exists())
                .andReturn();
        String otp = objectMapper.readTree(forgotRes.getResponse().getContentAsString())
                .get("data").get("devOtp").asText();
        assertEquals(6, otp.length());

        // 5 wrong attempts lock the OTP
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/reset-password")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"reset.target@gmail.com\",\"otp\":\"000000\",\"newPassword\":\"NewPass123\",\"confirmPassword\":\"NewPass123\"}"))
                    .andExpect(status().isBadRequest());
        }

        // Even correct OTP is now rejected because attempts == 5
        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"reset.target@gmail.com\",\"otp\":\"" + otp + "\",\"newPassword\":\"NewPass123\",\"confirmPassword\":\"NewPass123\"}"))
                .andExpect(status().isBadRequest());

        // Request fresh OTP and reset successfully
        MvcResult forgotRes2 = mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"reset.target@gmail.com\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String otp2 = objectMapper.readTree(forgotRes2.getResponse().getContentAsString())
                .get("data").get("devOtp").asText();

        mockMvc.perform(post("/api/auth/reset-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"reset.target@gmail.com\",\"otp\":\"" + otp2 + "\",\"newPassword\":\"NewPass123\",\"confirmPassword\":\"NewPass123\"}"))
                .andExpect(status().isOk());

        // Active refresh token was revoked on password reset
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + activeSession.refreshToken() + "\"}"))
                .andExpect(status().isUnauthorized());

        // Login with new password works
        var newLogin = authService.login(new LoginRequest("reset.target@gmail.com", "NewPass123", Role.CUSTOMER, false));
        assertNotNull(newLogin.token());
    }

    @Test
    void profileUpdateAndChangePasswordWork() throws Exception {
        userRepository.save(AppUser.builder()
                .fullName("Profile User")
                .email("profile.user@gmail.com")
                .passwordHash(AuthService.hashPassword("InitPass123"))
                .phone("0901112233")
                .role(Role.CUSTOMER)
                .demoAccount(false)
                .build());

        var auth = authService.login(new LoginRequest("profile.user@gmail.com", "InitPass123", Role.CUSTOMER, false));

        // Update profile
        mockMvc.perform(put("/api/auth/profile")
                        .header("Authorization", "Bearer " + auth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Profile Updated\",\"phone\":\"+84 901 999 888\",\"avatarUrl\":\"/images/avatars/custom.jpg\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Profile Updated"))
                .andExpect(jsonPath("$.data.phone").value("+84901999888"))
                .andExpect(jsonPath("$.data.avatarUrl").value("/images/avatars/custom.jpg"));

        // Change password wrong current -> 400
        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + auth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"WrongPass123\",\"newPassword\":\"ChangedPass123\",\"confirmPassword\":\"ChangedPass123\"}"))
                .andExpect(status().isBadRequest());

        // Change password valid -> 200
        mockMvc.perform(post("/api/auth/change-password")
                        .header("Authorization", "Bearer " + auth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"InitPass123\",\"newPassword\":\"ChangedPass123\",\"confirmPassword\":\"ChangedPass123\"}"))
                .andExpect(status().isOk());

        assertNotNull(authService.login(new LoginRequest("profile.user@gmail.com", "ChangedPass123", Role.CUSTOMER, false)).token());
    }

    @Test
    void vietnameseTextUtilAndPresetOptionSearchSort() throws Exception {
        assertEquals("du thuyen vinh ha long", VietnameseTextUtil.normalize("  Du thuyền Vịnh Hạ Long  "));
        assertEquals("da nang - hoi an", VietnameseTextUtil.normalize("Đà Nẵng - Hội An"));

        // Search without diacritics on region 1 (Vịnh Hạ Long)
        mockMvc.perform(get("/api/options")
                        .param("regionId", "1")
                        .param("q", "du thuyen"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThan(0)));

        // Sort price_asc
        MvcResult ascRes = mockMvc.perform(get("/api/options")
                        .param("regionId", "1")
                        .param("category", "ALL")
                        .param("sort", "price_asc"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode ascArr = objectMapper.readTree(ascRes.getResponse().getContentAsString()).get("data");
        for (int i = 1; i < ascArr.size(); i++) {
            long prev = ascArr.get(i - 1).get("pricePerPerson").asLong();
            long curr = ascArr.get(i).get("pricePerPerson").asLong();
            assertTrue(prev <= curr);
        }

        // Sort price_desc
        MvcResult descRes = mockMvc.perform(get("/api/options")
                        .param("regionId", "1")
                        .param("sort", "price_desc"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode descArr = objectMapper.readTree(descRes.getResponse().getContentAsString()).get("data");
        for (int i = 1; i < descArr.size(); i++) {
            long prev = descArr.get(i - 1).get("pricePerPerson").asLong();
            long curr = descArr.get(i).get("pricePerPerson").asLong();
            assertTrue(prev >= curr);
        }
    }

    private static String sha256Hex(String input) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder(digest.length * 2);
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
