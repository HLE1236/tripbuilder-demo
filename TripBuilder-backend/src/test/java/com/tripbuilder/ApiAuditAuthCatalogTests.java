package com.tripbuilder;

import com.tripbuilder.entity.user.Role;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb_audit_1;MODE=MSSQLServer;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ApiAuditAuthCatalogTests {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private JsonNode registerFreshUser(String prefix, String password) throws Exception {
        String email = prefix + "." + UUID.randomUUID().toString().substring(0, 8) + "@gmail.com";
        String body = """
                {
                  "fullName": "Audit Test User",
                  "email": "%s",
                  "phone": "0901234567",
                  "password": "%s",
                  "confirmPassword": "%s",
                  "acceptedTerms": true
                }
                """.formatted(email, password, password);

        MvcResult res = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andReturn();

        return objectMapper.readTree(res.getResponse().getContentAsString(StandardCharsets.UTF_8)).get("data");
    }

    // ==================== 1. Hello & System Endpoints ====================

    @Test
    void helloAndSystemEndpoints() throws Exception {
        mockMvc.perform(get("/api/hello"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.status").value("UP"))
                .andExpect(jsonPath("$.data.databaseProduct").value("CONNECTED"))
                .andExpect(jsonPath("$.data.regionCount").value(greaterThan(0)))
                .andExpect(jsonPath("$.data.latencyMs").value(greaterThanOrEqualTo(0)))
                .andExpect(jsonPath("$.data.serverTime").isNotEmpty());

        mockMvc.perform(post("/api/hello"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.statusCode").value(405));

        // /api/system/** is public in AuthInterceptor, unmapped path should return 404 (not 401/500)
        mockMvc.perform(get("/api/system/nonexistent"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404));
    }

    // ==================== 2. Region Endpoints ====================

    @Test
    void regionsEndpointsHappyAndEdgeCases() throws Exception {
        MvcResult listRes = mockMvc.perform(get("/api/regions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(greaterThan(0)))
                .andExpect(jsonPath("$.data[0].id").isNumber())
                .andExpect(jsonPath("$.data[0].name").isNotEmpty())
                .andReturn();

        JsonNode regions = objectMapper.readTree(listRes.getResponse().getContentAsString(StandardCharsets.UTF_8)).get("data");
        long firstRegionId = regions.get(0).get("id").asLong();

        // Photos for valid region
        mockMvc.perform(get("/api/regions/{id}/photos", firstRegionId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data").isArray());

        // Photos with category & blank category
        mockMvc.perform(get("/api/regions/{id}/photos", firstRegionId).param("category", "   "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200));

        mockMvc.perform(get("/api/regions/{id}/photos", firstRegionId).param("category", "NON_EXISTENT_CATEGORY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data").isEmpty());

        // Non-existent region ID -> 400 (BadRequestException in RegionService)
        mockMvc.perform(get("/api/regions/{id}/photos", 999999L))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));

        // Malformed region ID path variable -> 400
        mockMvc.perform(get("/api/regions/abc/photos"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));

        // All photos
        mockMvc.perform(get("/api/regions/photos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(greaterThan(0)));

        mockMvc.perform(get("/api/regions/photos").param("category", "NON_EXISTENT_CATEGORY"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());

        // No GET /api/regions/{id} endpoint mapped -> 404
        mockMvc.perform(get("/api/regions/{id}", firstRegionId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.statusCode").value(404));

        // Non-GET on /api/regions is not mapped -> 405 Method Not Allowed
        mockMvc.perform(post("/api/regions"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.statusCode").value(405));
    }

    // ==================== 3. PresetOption Endpoints ====================

    @Test
    void presetOptionsEndpointsHappyAndEdgeCases() throws Exception {
        MvcResult listRes = mockMvc.perform(get("/api/regions"))
                .andExpect(status().isOk())
                .andReturn();
        long regionId = objectMapper.readTree(listRes.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .get("data").get(0).get("id").asLong();

        // Default query
        mockMvc.perform(get("/api/options").param("regionId", String.valueOf(regionId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data").isArray());

        // Sort price_asc & category=ALL
        MvcResult ascRes = mockMvc.perform(get("/api/options")
                        .param("regionId", String.valueOf(regionId))
                        .param("category", "ALL")
                        .param("sort", "price_asc"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode ascData = objectMapper.readTree(ascRes.getResponse().getContentAsString(StandardCharsets.UTF_8)).get("data");
        for (int i = 1; i < ascData.size(); i++) {
            assertTrue(ascData.get(i - 1).get("pricePerPerson").asLong() <= ascData.get(i).get("pricePerPerson").asLong());
        }

        // Sort price_desc
        MvcResult descRes = mockMvc.perform(get("/api/options")
                        .param("regionId", String.valueOf(regionId))
                        .param("sort", "price_desc"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode descData = objectMapper.readTree(descRes.getResponse().getContentAsString(StandardCharsets.UTF_8)).get("data");
        for (int i = 1; i < descData.size(); i++) {
            assertTrue(descData.get(i - 1).get("pricePerPerson").asLong() >= descData.get(i).get("pricePerPerson").asLong());
        }

        // Search query & unknown sort fallback
        mockMvc.perform(get("/api/options")
                        .param("regionId", String.valueOf(regionId))
                        .param("category", "Khách sạn")
                        .param("q", "   ")
                        .param("sort", "invalid_sort"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200));

        // Non-existent regionId returns 200 with empty list
        mockMvc.perform(get("/api/options").param("regionId", "999999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isEmpty());

        // Missing regionId -> 400
        mockMvc.perform(get("/api/options"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));

        // Non-numeric regionId -> 400
        mockMvc.perform(get("/api/options").param("regionId", "not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));

        // Non-GET on /api/options is not mapped -> 405 Method Not Allowed
        mockMvc.perform(post("/api/options"))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(jsonPath("$.statusCode").value(405));
    }

    // ==================== 4. Auth Login ====================

    @Test
    void authLoginHappyAndBoundaryCases() throws Exception {
        // Missing body / invalid JSON -> 400
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content("{invalid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));

        // Blank email / blank password -> 400
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"   \",\"password\":\"123456\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"an.nguyen@gmail.com\",\"password\":\"\"}"))
                .andExpect(status().isBadRequest());

        // Invalid enum value for expectedRole -> 400
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"an.nguyen@gmail.com\",\"password\":\"123456\",\"expectedRole\":\"SUPERADMIN\"}"))
                .andExpect(status().isBadRequest());

        // Non-existent user / wrong password / role mismatch -> 401
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody@example.com\",\"password\":\"123456\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.statusCode").value(401));

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"an.nguyen@gmail.com\",\"password\":\"wrongpass\"}"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"an.nguyen@gmail.com\",\"password\":\"123456\",\"expectedRole\":\"GUIDE\"}"))
                .andExpect(status().isUnauthorized());

        // Valid login for CUSTOMER, GUIDE, ADMIN (including null expectedRole)
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"an.nguyen@gmail.com\",\"password\":\"123456\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.data.expiresInSeconds").value(1800))
                .andExpect(jsonPath("$.data.user.role").value("CUSTOMER"));

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"binh.guide@tripbuilder.vn\",\"password\":\"123456\",\"expectedRole\":\"GUIDE\",\"rememberMe\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role").value("GUIDE"));

        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@tripbuilder.vn\",\"password\":\"123456\",\"expectedRole\":\"ADMIN\",\"rememberMe\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role").value("ADMIN"));
    }

    // ==================== 5. Auth Register ====================

    @Test
    void authRegisterValidationAndHappyPath() throws Exception {
        // Missing body & malformed JSON -> 400
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content("{bad"))
                .andExpect(status().isBadRequest());

        // 1-char fullName -> 400
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"A\",\"email\":\"t1@gmail.com\",\"phone\":\"0901234567\",\"password\":\"StrongPass1\",\"confirmPassword\":\"StrongPass1\",\"acceptedTerms\":true}"))
                .andExpect(status().isBadRequest());

        // 101-char fullName -> 400
        String longName = "A".repeat(101);
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"" + longName + "\",\"email\":\"t2@gmail.com\",\"phone\":\"0901234567\",\"password\":\"StrongPass1\",\"confirmPassword\":\"StrongPass1\",\"acceptedTerms\":true}"))
                .andExpect(status().isBadRequest());

        // Invalid email -> 400
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Ab\",\"email\":\"not-an-email\",\"phone\":\"0901234567\",\"password\":\"StrongPass1\",\"confirmPassword\":\"StrongPass1\",\"acceptedTerms\":true}"))
                .andExpect(status().isBadRequest());

        // Duplicate email (case-insensitive) -> 400
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Ab\",\"email\":\"AN.NGUYEN@GMAIL.COM\",\"phone\":\"0901234567\",\"password\":\"StrongPass1\",\"confirmPassword\":\"StrongPass1\",\"acceptedTerms\":true}"))
                .andExpect(status().isBadRequest());

        // Missing confirmPassword / acceptedTerms=null -> 400
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Ab\",\"email\":\"t3@gmail.com\",\"phone\":\"0901234567\",\"password\":\"StrongPass1\",\"acceptedTerms\":true}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Ab\",\"email\":\"t3@gmail.com\",\"phone\":\"0901234567\",\"password\":\"StrongPass1\",\"confirmPassword\":\"StrongPass1\"}"))
                .andExpect(status().isBadRequest());

        // Boundary valid: 2-char fullName, +84 phone
        String uniqueEmail = "reg." + UUID.randomUUID().toString().substring(0, 8) + "@gmail.com";
        mockMvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"An\",\"email\":\"" + uniqueEmail + "\",\"phone\":\"+84 901 234 567\",\"password\":\"StrongPass1\",\"confirmPassword\":\"StrongPass1\",\"acceptedTerms\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.user.phone").value("+84901234567"))
                .andExpect(jsonPath("$.data.user.role").value("CUSTOMER"));
    }

    // ==================== 6. Auth Refresh & Logout ====================

    @Test
    void authRefreshAndLogoutAndTokenRevocation() throws Exception {
        // Invalid JSON -> 400
        mockMvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON).content("{bad"))
                .andExpect(status().isBadRequest());

        // Null / blank / unknown refreshToken -> 401
        mockMvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON).content("{\"refreshToken\":\"   \"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON).content("{\"refreshToken\":\"unknown-token\"}"))
                .andExpect(status().isUnauthorized());

        JsonNode auth = registerFreshUser("logout", "StrongPass1");
        String accessToken = auth.get("token").asText();
        String refreshToken = auth.get("refreshToken").asText();

        // Refresh rotates token
        MvcResult refreshRes = mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andReturn();
        JsonNode rotated = objectMapper.readTree(refreshRes.getResponse().getContentAsString(StandardCharsets.UTF_8)).get("data");
        String rotatedRefresh = rotated.get("refreshToken").asText();

        // Old refresh token rejected
        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isUnauthorized());

        // Logout with no body & no header -> 200
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200));

        // Logout with bogus Bearer token -> 200
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer invalid.token"))
                .andExpect(status().isOk());

        // Logout with valid Bearer + refresh token revokes both
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + rotatedRefresh + "\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + rotatedRefresh + "\"}"))
                .andExpect(status().isUnauthorized());
    }

    // ==================== 7. Forgot & Reset Password ====================

    @Test
    void authForgotAndResetPasswordFlows() throws Exception {
        // Invalid/missing email -> 400
        mockMvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON).content("{\"email\":\"bad-email\"}"))
                .andExpect(status().isBadRequest());

        // Non-existent email -> 200 without devOtp
        mockMvc.perform(post("/api/auth/forgot-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"nobody.audit@example.com\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.devOtp").doesNotExist());

        JsonNode auth = registerFreshUser("reset", "StrongPass1");
        String email = auth.get("user").get("email").asText();
        String oldAccessToken = auth.get("token").asText();

        // Request OTP
        MvcResult forgotRes = mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.devOtp").isNotEmpty())
                .andReturn();
        String otp1 = objectMapper.readTree(forgotRes.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .get("data").get("devOtp").asText();

        // Reset with blank OTP -> 400
        mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"\",\"newPassword\":\"NewPass123\",\"confirmPassword\":\"NewPass123\"}"))
                .andExpect(status().isBadRequest());

        // 5 failed OTP attempts -> locked
        for (int i = 0; i < 5; i++) {
            mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\":\"" + email + "\",\"otp\":\"000000\",\"newPassword\":\"NewPass123\",\"confirmPassword\":\"NewPass123\"}"))
                    .andExpect(status().isBadRequest());
        }
        mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp1 + "\",\"newPassword\":\"NewPass123\",\"confirmPassword\":\"NewPass123\"}"))
                .andExpect(status().isBadRequest());

        // Request fresh OTP
        MvcResult forgotRes2 = mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\"}"))
                .andExpect(status().isOk())
                .andReturn();
        String otp2 = objectMapper.readTree(forgotRes2.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .get("data").get("devOtp").asText();

        // Valid OTP + weak password -> 400 (OTP remains unused)
        mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp2 + "\",\"newPassword\":\"weak\",\"confirmPassword\":\"weak\"}"))
                .andExpect(status().isBadRequest());

        // Valid OTP + strong password -> 200
        mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp2 + "\",\"newPassword\":\"NewStrong99\",\"confirmPassword\":\"NewStrong99\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200));

        // Old access token revoked -> 401
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + oldAccessToken))
                .andExpect(status().isUnauthorized());

        // Reusing used OTP -> 400
        mockMvc.perform(post("/api/auth/reset-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"otp\":\"" + otp2 + "\",\"newPassword\":\"Another99\",\"confirmPassword\":\"Another99\"}"))
                .andExpect(status().isBadRequest());

        // Login with new password -> 200
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"NewStrong99\"}"))
                .andExpect(status().isOk());
    }

    // ==================== 8. /me & /profile ====================

    @Test
    void authMeAndProfileUpdate() throws Exception {
        // Unauthenticated & malformed tokens -> 401
        mockMvc.perform(get("/api/auth/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Basic abc")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer ")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer badformat")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer dGVzdA.invalidsig")).andExpect(status().isUnauthorized());

        mockMvc.perform(put("/api/auth/profile").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Test\",\"phone\":\"0901234567\"}"))
                .andExpect(status().isUnauthorized());

        JsonNode auth = registerFreshUser("profile", "StrongPass1");
        String token = auth.get("token").asText();

        // /me -> 200
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.role").value("CUSTOMER"));

        // Invalid profile payloads -> 400
        mockMvc.perform(put("/api/auth/profile").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/auth/profile").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"A\",\"phone\":\"0901234567\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/auth/profile").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Valid Name\",\"phone\":\"123\"}"))
                .andExpect(status().isBadRequest());

        String longAvatar = "https://example.com/" + "a".repeat(500);
        mockMvc.perform(put("/api/auth/profile").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Valid Name\",\"phone\":\"0901234567\",\"avatarUrl\":\"" + longAvatar + "\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/auth/profile").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Valid Name\",\"phone\":\"0901234567\",\"avatarUrl\":\"javascript:alert(1)\"}"))
                .andExpect(status().isBadRequest());

        // Valid profile update -> 200
        mockMvc.perform(put("/api/auth/profile").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"  Updated Name  \",\"phone\":\"0912 345 678\",\"avatarUrl\":\"/images/avatars/new.jpg\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.fullName").value("Updated Name"))
                .andExpect(jsonPath("$.data.phone").value("0912345678"))
                .andExpect(jsonPath("$.data.avatarUrl").value("/images/avatars/new.jpg"));
    }

    // ==================== 9. Change Password ====================

    @Test
    void authChangePasswordAndTokenRevocation() throws Exception {
        mockMvc.perform(post("/api/auth/change-password").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"StrongPass1\",\"newPassword\":\"NewPass123\",\"confirmPassword\":\"NewPass123\"}"))
                .andExpect(status().isUnauthorized());

        JsonNode auth = registerFreshUser("chgpwd", "StrongPass1");
        String email = auth.get("user").get("email").asText();
        String token = auth.get("token").asText();
        String refreshToken = auth.get("refreshToken").asText();

        // Missing body / blank currentPassword / wrong currentPassword / weak newPassword / mismatch -> 400
        mockMvc.perform(post("/api/auth/change-password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/change-password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"\",\"newPassword\":\"NewPass123\",\"confirmPassword\":\"NewPass123\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/change-password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"WrongPass1\",\"newPassword\":\"NewPass123\",\"confirmPassword\":\"NewPass123\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/change-password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"StrongPass1\",\"newPassword\":\"weak\",\"confirmPassword\":\"weak\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/change-password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"StrongPass1\",\"newPassword\":\"StrongPass1\",\"confirmPassword\":\"StrongPass1\"}"))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/auth/change-password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"StrongPass1\",\"newPassword\":\"NewPass123\",\"confirmPassword\":\"Other123\"}"))
                .andExpect(status().isBadRequest());

        // Valid password change -> 200
        mockMvc.perform(post("/api/auth/change-password").header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"currentPassword\":\"StrongPass1\",\"newPassword\":\"NewPass123\",\"confirmPassword\":\"NewPass123\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200));

        // Existing access & refresh tokens are revoked
        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/refresh").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"refreshToken\":\"" + refreshToken + "\"}"))
                .andExpect(status().isUnauthorized());

        // Old password fails, new password succeeds
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"StrongPass1\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + email + "\",\"password\":\"NewPass123\"}"))
                .andExpect(status().isOk());
    }

    // ==================== 10. Demo Accounts ====================

    @Test
    void authDemoAccountsEndpoint() throws Exception {
        // Missing role -> 400
        mockMvc.perform(get("/api/auth/demo-accounts"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));

        // Invalid role -> 400
        mockMvc.perform(get("/api/auth/demo-accounts").param("role", "INVALID_ROLE"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));

        // Empty role -> 400
        mockMvc.perform(get("/api/auth/demo-accounts").param("role", ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));

        for (Role role : Role.values()) {
            MvcResult res = mockMvc.perform(get("/api/auth/demo-accounts").param("role", role.name()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(200))
                    .andExpect(jsonPath("$.data").isArray())
                    .andExpect(jsonPath("$.data.length()").value(greaterThan(0)))
                    .andReturn();

            String body = res.getResponse().getContentAsString(StandardCharsets.UTF_8);
            assertFalse(body.contains("passwordHash"));
        }
    }
}
