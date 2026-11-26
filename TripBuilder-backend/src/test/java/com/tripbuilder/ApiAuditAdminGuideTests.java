package com.tripbuilder;

import com.tripbuilder.dto.request.auth.LoginRequest;
import com.tripbuilder.entity.booking.Booking;
import com.tripbuilder.entity.booking.BookingStatus;
import com.tripbuilder.entity.notification.Notification;
import com.tripbuilder.entity.region.Region;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.repository.BookingRepository;
import com.tripbuilder.repository.NotificationRepository;
import com.tripbuilder.repository.RegionRepository;
import com.tripbuilder.repository.TourRepository;
import com.tripbuilder.repository.UserRepository;
import com.tripbuilder.service.auth.AuthService;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb_audit_3;MODE=MSSQLServer;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ApiAuditAdminGuideTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RegionRepository regionRepository;

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private TourRepository tourRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String loginToken(String email, Role role) {
        return authService.login(new LoginRequest(email, "123456", role, false)).token();
    }

    private String adminToken() {
        return loginToken("admin@tripbuilder.vn", Role.ADMIN);
    }

    private String guideToken() {
        return loginToken("binh.guide@tripbuilder.vn", Role.GUIDE);
    }

    private String customerToken() {
        return loginToken("an.nguyen@gmail.com", Role.CUSTOMER);
    }

    private JsonNode readJson(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    // ==================== 1. AdminController: Auth & RBAC ====================

    @Test
    void adminEndpointsRejectUnauthenticatedAndNonAdminRoles() throws Exception {
        String cust = customerToken();
        String guide = guideToken();

        // Unauthenticated -> 401
        mockMvc.perform(get("/api/admin/overview")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/users")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/admin/users")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/tours")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/bookings")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/preset-options")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/guide-applications")).andExpect(status().isUnauthorized());

        // Customer -> 403
        mockMvc.perform(get("/api/admin/overview").header("Authorization", "Bearer " + cust))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + cust))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/admin/preset-options")
                        .header("Authorization", "Bearer " + cust)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/guide-applications").header("Authorization", "Bearer " + cust))
                .andExpect(status().isForbidden());

        // Guide -> 403
        mockMvc.perform(get("/api/admin/overview").header("Authorization", "Bearer " + guide))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/bookings").header("Authorization", "Bearer " + guide))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/admin/bookings/1/reassign")
                        .header("Authorization", "Bearer " + guide)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"guideId\":1}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/admin/guide-applications/1/approve")
                        .header("Authorization", "Bearer " + guide))
                .andExpect(status().isForbidden());
    }

    // ==================== 2. AdminController: Overview, Tours, Bookings ====================

    @Test
    void adminOverviewToursAndBookingsReturnExpectedStructure() throws Exception {
        String admin = adminToken();

        mockMvc.perform(get("/api/admin/overview").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.totalBookings").isNumber())
                .andExpect(jsonPath("$.data.totalTours").isNumber())
                .andExpect(jsonPath("$.data.totalCustomers").isNumber())
                .andExpect(jsonPath("$.data.totalGuides").isNumber())
                .andExpect(jsonPath("$.data.totalRegions").isNumber())
                .andExpect(jsonPath("$.data.totalPresetOptions").isNumber());

        mockMvc.perform(get("/api/admin/tours").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].id").exists());

        mockMvc.perform(get("/api/admin/bookings").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data[0].code").exists());
    }

    // ==================== 3. AdminController: Users CRUD ====================

    @Test
    void adminUsersCrudValidationSelfDeleteAndRegionConstraints() throws Exception {
        String admin = adminToken();
        AppUser actingAdmin = userRepository.findByEmailIgnoreCase("admin@tripbuilder.vn").orElseThrow();
        Region region1 = regionRepository.findAll().get(0);
        Region region2 = regionRepository.findAll().get(1);

        // List all & filter by role
        mockMvc.perform(get("/api/admin/users").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data").isArray());

        mockMvc.perform(get("/api/admin/users?role=GUIDE").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].role").value("GUIDE"));

        // Invalid role param -> 400 (MethodArgumentTypeMismatchException)
        mockMvc.perform(get("/api/admin/users?role=SUPERADMIN").header("Authorization", "Bearer " + admin))
                .andExpect(status().isBadRequest());

        // Create user: missing required fields -> 400
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"\",\"email\":\"\",\"password\":\"\",\"role\":\"CUSTOMER\"}"))
                .andExpect(status().isBadRequest());

        // Create user: invalid email -> 400
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Test User\",\"email\":\"not-an-email\",\"password\":\"StrongPass99\",\"role\":\"CUSTOMER\"}"))
                .andExpect(status().isBadRequest());

        // Create user: weak password -> 400
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Test User\",\"email\":\"weak.pw@tripbuilder.vn\",\"password\":\"123456\",\"role\":\"CUSTOMER\"}"))
                .andExpect(status().isBadRequest());

        // Create user: duplicate email (case-insensitive) -> 400
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Dup User\",\"email\":\"AN.NGUYEN@GMAIL.COM\",\"password\":\"StrongPass99\",\"role\":\"CUSTOMER\"}"))
                .andExpect(status().isBadRequest());

        // Create GUIDE without regionId -> 400
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"No Region Guide\",\"email\":\"noregion.guide@tripbuilder.vn\",\"password\":\"StrongPass99\",\"role\":\"GUIDE\"}"))
                .andExpect(status().isBadRequest());

        // Create GUIDE with non-existent regionId -> 400
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Bad Region Guide\",\"email\":\"badregion.guide@tripbuilder.vn\",\"password\":\"StrongPass99\",\"role\":\"GUIDE\",\"regionId\":999999}"))
                .andExpect(status().isBadRequest());

        // Happy path: create GUIDE
        String createGuidePayload = objectMapper.writeValueAsString(Map.of(
                "fullName", "Audit Guide Mới",
                "email", "audit.newguide@tripbuilder.vn",
                "password", "StrongPass99",
                "phone", "0909 111 222",
                "role", "GUIDE",
                "regionId", region1.getId(),
                "bio", "Hướng dẫn viên bản địa nhiều kinh nghiệm",
                "yearsExperience", 5
        ));
        MvcResult createRes = mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createGuidePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.email").value("audit.newguide@tripbuilder.vn"))
                .andExpect(jsonPath("$.data.role").value("GUIDE"))
                .andExpect(jsonPath("$.data.regionId").value(region1.getId()))
                .andReturn();

        long createdGuideId = readJson(createRes).get("data").get("id").asLong();

        // Update user: blank fullName -> 400
        mockMvc.perform(put("/api/admin/users/" + createdGuideId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"   \"}"))
                .andExpect(status().isBadRequest());

        // Update user: non-existent ID -> 400
        mockMvc.perform(put("/api/admin/users/999999")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Ghost User\"}"))
                .andExpect(status().isBadRequest());

        // Update user: happy path (guide without tours can change region)
        String updatePayload = objectMapper.writeValueAsString(Map.of(
                "fullName", "Audit Guide Updated",
                "phone", "0909333444",
                "regionId", region2.getId(),
                "bio", "Cập nhật giới thiệu mới",
                "yearsExperience", 8
        ));
        mockMvc.perform(put("/api/admin/users/" + createdGuideId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatePayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.fullName").value("Audit Guide Updated"))
                .andExpect(jsonPath("$.data.regionId").value(region2.getId()));

        // Update GUIDE who already owns tours to a different region -> 400
        AppUser binh = userRepository.findByEmailIgnoreCase("binh.guide@tripbuilder.vn").orElseThrow();
        assertTrue(tourRepository.existsByGuideId(binh.getId()));
        long otherRegionId = regionRepository.findAll().stream()
                .map(Region::getId)
                .filter(id -> !id.equals(binh.getRegion().getId()))
                .findFirst().orElseThrow();
        mockMvc.perform(put("/api/admin/users/" + binh.getId())
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Trần Văn Bình\",\"regionId\":" + otherRegionId + "}"))
                .andExpect(status().isBadRequest());

        // Delete self -> 400
        mockMvc.perform(delete("/api/admin/users/" + actingAdmin.getId())
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isBadRequest());

        // Delete user with tours/bookings -> 400
        mockMvc.perform(delete("/api/admin/users/" + binh.getId())
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isBadRequest());

        // Delete non-existent user -> 400
        mockMvc.perform(delete("/api/admin/users/999999")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isBadRequest());

        // Happy path: delete freshly created user
        mockMvc.perform(delete("/api/admin/users/" + createdGuideId)
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200));

        assertTrue(userRepository.findById(createdGuideId).isEmpty());
    }

    // ==================== 4. AdminController: Reassign Guide ====================

    @Test
    void adminReassignGuideValidatesRegionStatusAndNotifies() throws Exception {
        String admin = adminToken();

        Booking activeBooking = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.WAITING_REQUOTE
                        && b.getTour() != null
                        && b.getTour().getRegion() != null
                        && b.getGuide() != null)
                .findFirst()
                .orElseThrow();

        Long tourRegionId = activeBooking.getTour().getRegion().getId();
        Long currentGuideId = activeBooking.getGuide().getId();

        // Missing/null guideId -> 400
        mockMvc.perform(put("/api/admin/bookings/" + activeBooking.getId() + "/reassign")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        // Non-existent booking -> 400
        mockMvc.perform(put("/api/admin/bookings/999999/reassign")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"guideId\":" + currentGuideId + "}"))
                .andExpect(status().isBadRequest());

        // Non-guide user (CUSTOMER) -> 400
        AppUser customer = userRepository.findByEmailIgnoreCase("an.nguyen@gmail.com").orElseThrow();
        mockMvc.perform(put("/api/admin/bookings/" + activeBooking.getId() + "/reassign")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"guideId\":" + customer.getId() + "}"))
                .andExpect(status().isBadRequest());

        // Wrong region guide -> 400
        AppUser wrongRegionGuide = userRepository.findByRoleOrderByIdAsc(Role.GUIDE).stream()
                .filter(g -> g.getRegion() != null && !g.getRegion().getId().equals(tourRegionId))
                .findFirst()
                .orElseThrow();
        mockMvc.perform(put("/api/admin/bookings/" + activeBooking.getId() + "/reassign")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"guideId\":" + wrongRegionGuide.getId() + "}"))
                .andExpect(status().isBadRequest());

        // COMPLETED or CANCELLED booking cannot be reassigned -> 400
        Booking closedBooking = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.CANCELLED)
                .findFirst()
                .orElseThrow();
        mockMvc.perform(put("/api/admin/bookings/" + closedBooking.getId() + "/reassign")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"guideId\":" + currentGuideId + "}"))
                .andExpect(status().isBadRequest());

        // Happy path: create a fresh guide in the same region (no schedule overlap) and reassign
        Region tourRegion = activeBooking.getTour().getRegion();
        String newGuidePayload = objectMapper.writeValueAsString(Map.of(
                "fullName", "Guide Reassign Target",
                "email", "reassign.target@tripbuilder.vn",
                "password", "StrongPass99",
                "phone", "0908111222",
                "role", "GUIDE",
                "regionId", tourRegion.getId()
        ));
        MvcResult gRes = mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newGuidePayload))
                .andExpect(status().isOk())
                .andReturn();
        long newGuideId = readJson(gRes).get("data").get("id").asLong();

        mockMvc.perform(put("/api/admin/bookings/" + activeBooking.getId() + "/reassign")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"guideId\":" + newGuideId + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.guide.id").value(newGuideId));

        assertTrue(notificationRepository.countByRecipientIdAndReadFalse(newGuideId) > 0);
    }

    // ==================== 5. AdminController: Preset Options CRUD ====================

    @Test
    void adminPresetOptionsCrudAndValidation() throws Exception {
        String admin = adminToken();
        Region region = regionRepository.findAll().get(0);

        mockMvc.perform(get("/api/admin/preset-options").header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data").isArray());

        // Missing fields -> 400
        mockMvc.perform(post("/api/admin/preset-options")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"regionId\":" + region.getId() + ",\"category\":\"\",\"title\":\"\"}"))
                .andExpect(status().isBadRequest());

        // Negative price -> 400
        mockMvc.perform(post("/api/admin/preset-options")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"regionId\":" + region.getId() + ",\"category\":\"HOTEL\",\"title\":\"Test Hotel\",\"pricePerPerson\":-100}"))
                .andExpect(status().isBadRequest());

        // Invalid category -> 400
        mockMvc.perform(post("/api/admin/preset-options")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"regionId\":" + region.getId() + ",\"category\":\"UNKNOWN_CAT\",\"title\":\"Test\",\"pricePerPerson\":100000}"))
                .andExpect(status().isBadRequest());

        // Title > 200 chars -> 400
        String longTitle = "A".repeat(201);
        mockMvc.perform(post("/api/admin/preset-options")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "regionId", region.getId(),
                                "category", "HOTEL",
                                "title", longTitle,
                                "pricePerPerson", 100000
                        ))))
                .andExpect(status().isBadRequest());

        // Happy path create (HOTEL -> Khách sạn)
        MvcResult createOptRes = mockMvc.perform(post("/api/admin/preset-options")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "regionId", region.getId(),
                                "category", "HOTEL",
                                "title", "Audit Resort 5 Sao",
                                "description", "Phòng hướng biển",
                                "pricePerPerson", 1200000
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.category").value("Khách sạn"))
                .andExpect(jsonPath("$.data.title").value("Audit Resort 5 Sao"))
                .andReturn();

        long optionId = readJson(createOptRes).get("data").get("id").asLong();

        // Update non-existent -> 400
        mockMvc.perform(put("/api/admin/preset-options/999999")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"regionId\":" + region.getId() + ",\"category\":\"FOOD\",\"title\":\"X\",\"pricePerPerson\":50000}"))
                .andExpect(status().isBadRequest());

        // Happy path update
        mockMvc.perform(put("/api/admin/preset-options/" + optionId)
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "regionId", region.getId(),
                                "category", "FOOD",
                                "title", "Audit Hải Sản Tươi",
                                "description", "Bữa tối BBQ",
                                "pricePerPerson", 450000
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").value("Ăn uống"))
                .andExpect(jsonPath("$.data.title").value("Audit Hải Sản Tươi"))
                .andExpect(jsonPath("$.data.pricePerPerson").value(450000));

        // Delete non-existent -> 400
        mockMvc.perform(delete("/api/admin/preset-options/999999")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isBadRequest());

        // Happy path delete
        mockMvc.perform(delete("/api/admin/preset-options/" + optionId)
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200));
    }

    // ==================== 6. GuideApplicationController & Admin Review Flow ====================

    @Test
    void guideApplicationSubmitLookupApproveAndRejectFlow() throws Exception {
        String admin = adminToken();
        Region region1 = regionRepository.findAll().get(0);
        Region region2 = regionRepository.findAll().get(1);

        // Validation errors on public submit -> 400
        // 1) Accepted terms = false
        mockMvc.perform(post("/api/guide-applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Nguyễn Hướng Dẫn",
                                "email", "ga.invalid1@gmail.com",
                                "phone", "0901234567",
                                "password", "StrongPass99",
                                "confirmPassword", "StrongPass99",
                                "regionId", region1.getId(),
                                "bio", "Giới thiệu đủ dài hơn hai mươi ký tự để kiểm tra.",
                                "acceptedTerms", false
                        ))))
                .andExpect(status().isBadRequest());

        // 2) Bio too short (< 20 chars)
        mockMvc.perform(post("/api/guide-applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Nguyễn Hướng Dẫn",
                                "email", "ga.invalid2@gmail.com",
                                "phone", "0901234567",
                                "password", "StrongPass99",
                                "confirmPassword", "StrongPass99",
                                "regionId", region1.getId(),
                                "bio", "Quá ngắn",
                                "acceptedTerms", true
                        ))))
                .andExpect(status().isBadRequest());

        // 3) Existing user email -> 400
        mockMvc.perform(post("/api/guide-applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Nguyễn Hướng Dẫn",
                                "email", "an.nguyen@gmail.com",
                                "phone", "0901234567",
                                "password", "StrongPass99",
                                "confirmPassword", "StrongPass99",
                                "regionId", region1.getId(),
                                "bio", "Giới thiệu đủ dài hơn hai mươi ký tự để kiểm tra.",
                                "acceptedTerms", true
                        ))))
                .andExpect(status().isBadRequest());

        // Happy path submit #1 (will be APPROVED)
        String applicantEmail1 = "ga.approve.test@gmail.com";
        MvcResult submitRes1 = mockMvc.perform(post("/api/guide-applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.ofEntries(
                                Map.entry("fullName", "Lê Văn Duyệt"),
                                Map.entry("email", applicantEmail1),
                                Map.entry("phone", "0912 888 999"),
                                Map.entry("password", "StrongPass99"),
                                Map.entry("confirmPassword", "StrongPass99"),
                                Map.entry("regionId", region1.getId()),
                                Map.entry("yearsExperience", 6),
                                Map.entry("licenseNumber", "HDV-2026-001"),
                                Map.entry("languages", "Tiếng Việt, Tiếng Anh"),
                                Map.entry("bio", "Hướng dẫn viên bản địa chuyên tuyến di sản và trải nghiệm văn hoá địa phương."),
                                Map.entry("acceptedTerms", true)
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.applicationCode").exists())
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andReturn();

        String appCode1 = readJson(submitRes1).get("data").get("applicationCode").asText();

        // Duplicate PENDING submission for same email -> 400
        mockMvc.perform(post("/api/guide-applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Lê Văn Duyệt",
                                "email", applicantEmail1,
                                "phone", "0912888999",
                                "password", "StrongPass99",
                                "confirmPassword", "StrongPass99",
                                "regionId", region1.getId(),
                                "bio", "Hướng dẫn viên bản địa chuyên tuyến di sản và trải nghiệm văn hoá địa phương.",
                                "acceptedTerms", true
                        ))))
                .andExpect(status().isBadRequest());

        // Public lookup: missing fields -> 400
        mockMvc.perform(post("/api/guide-applications/lookup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"\",\"applicationCode\":\"\"}"))
                .andExpect(status().isBadRequest());

        // Public lookup: wrong code -> 400
        mockMvc.perform(post("/api/guide-applications/lookup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", applicantEmail1,
                                "applicationCode", "GA-WRONG"
                        ))))
                .andExpect(status().isBadRequest());

        // Public lookup: happy path (case-insensitive)
        mockMvc.perform(post("/api/guide-applications/lookup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", applicantEmail1.toUpperCase(),
                                "applicationCode", appCode1.toLowerCase()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.applicationCode").value(appCode1))
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        // Admin lists PENDING applications and finds appCode1
        MvcResult listRes = mockMvc.perform(get("/api/admin/guide-applications?status=PENDING")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andReturn();

        long appId1 = -1;
        for (JsonNode node : readJson(listRes).get("data")) {
            if (appCode1.equals(node.get("applicationCode").asText())) {
                appId1 = node.get("id").asLong();
                break;
            }
        }
        assertTrue(appId1 > 0);

        // Admin approves appId1 with region override -> 200
        mockMvc.perform(post("/api/admin/guide-applications/" + appId1 + "/approve")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "regionId", region2.getId(),
                                "reviewNote", "Hồ sơ đạt yêu cầu"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.regionId").value(region2.getId()))
                .andExpect(jsonPath("$.data.createdUserId").isNumber());

        // Re-approving or rejecting an already APPROVED application -> 400
        mockMvc.perform(post("/api/admin/guide-applications/" + appId1 + "/approve")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/admin/guide-applications/" + appId1 + "/reject")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewNote\":\"Không thể từ chối lại\"}"))
                .andExpect(status().isBadRequest());

        // Approved guide can now log in!
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", applicantEmail1,
                                "password", "StrongPass99",
                                "expectedRole", "GUIDE",
                                "rememberMe", false
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role").value("GUIDE"));

        // Submit #2 for reject testing
        String applicantEmail2 = "ga.reject.test@gmail.com";
        MvcResult submitRes2 = mockMvc.perform(post("/api/guide-applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "fullName", "Phạm Từ Chối",
                                "email", applicantEmail2,
                                "phone", "0988777666",
                                "password", "StrongPass99",
                                "confirmPassword", "StrongPass99",
                                "regionId", region1.getId(),
                                "bio", "Giới thiệu đủ dài hơn hai mươi ký tự để test quy trình từ chối.",
                                "acceptedTerms", true
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        String appCode2 = readJson(submitRes2).get("data").get("applicationCode").asText();

        MvcResult listAllRes = mockMvc.perform(get("/api/admin/guide-applications")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isOk())
                .andReturn();
        long appId2 = -1;
        for (JsonNode node : readJson(listAllRes).get("data")) {
            if (appCode2.equals(node.get("applicationCode").asText())) {
                appId2 = node.get("id").asLong();
                break;
            }
        }
        assertTrue(appId2 > 0);

        // Reject with blank reviewNote -> 400
        mockMvc.perform(post("/api/admin/guide-applications/" + appId2 + "/reject")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewNote\":\"   \"}"))
                .andExpect(status().isBadRequest());

        // Reject with >500 chars reviewNote -> 400
        mockMvc.perform(post("/api/admin/guide-applications/" + appId2 + "/reject")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reviewNote", "X".repeat(501)))))
                .andExpect(status().isBadRequest());

        // Happy path reject
        mockMvc.perform(post("/api/admin/guide-applications/" + appId2 + "/reject")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewNote\":\"Thiếu chứng chỉ hành nghề HDV\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"))
                .andExpect(jsonPath("$.data.reviewNote").value("Thiếu chứng chỉ hành nghề HDV"));

        // Non-existent application approve/reject -> 400
        mockMvc.perform(post("/api/admin/guide-applications/999999/approve")
                        .header("Authorization", "Bearer " + admin))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/admin/guide-applications/999999/reject")
                        .header("Authorization", "Bearer " + admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewNote\":\"Not found\"}"))
                .andExpect(status().isBadRequest());
    }

    // ==================== 7. NotificationController: List, Read, Read-All & IDOR ====================

    @Test
    void notificationsIsolationMarkReadAndMarkAllRead() throws Exception {
        // Unauthenticated -> 401
        mockMvc.perform(get("/api/notifications")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/notifications/1/read")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/notifications/read-all")).andExpect(status().isUnauthorized());

        AppUser guideA = userRepository.findByEmailIgnoreCase("binh.guide@tripbuilder.vn").orElseThrow();
        AppUser guideB = userRepository.findByEmailIgnoreCase("chi.guide@tripbuilder.vn").orElseThrow();

        Notification notifA1 = notificationRepository.save(Notification.builder()
                .recipient(guideA)
                .type("AUDIT_TEST")
                .title("Thông báo A1")
                .message("Nội dung A1")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
        Notification notifA2 = notificationRepository.save(Notification.builder()
                .recipient(guideA)
                .type("AUDIT_TEST")
                .title("Thông báo A2")
                .message("Nội dung A2")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
        Notification notifB = notificationRepository.save(Notification.builder()
                .recipient(guideB)
                .type("AUDIT_TEST")
                .title("Thông báo B riêng tư")
                .message("Nội dung B")
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());

        String tokenA = loginToken("binh.guide@tripbuilder.vn", Role.GUIDE);
        String tokenB = loginToken("chi.guide@tripbuilder.vn", Role.GUIDE);

        // Guide A lists notifications: sees A1 & A2, never B
        MvcResult listARes = mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.unreadCount").isNumber())
                .andExpect(jsonPath("$.data.items").isArray())
                .andReturn();

        JsonNode itemsA = readJson(listARes).get("data").get("items");
        List<Long> idsA = new java.util.ArrayList<>();
        for (JsonNode item : itemsA) {
            idsA.add(item.get("id").asLong());
        }
        assertTrue(idsA.contains(notifA1.getId()));
        assertFalse(idsA.contains(notifB.getId()));

        // IDOR check: Guide A tries to mark Guide B's notification as read -> 400
        mockMvc.perform(post("/api/notifications/" + notifB.getId() + "/read")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest());
        assertFalse(notificationRepository.findById(notifB.getId()).orElseThrow().getRead());

        // Non-existent notification -> 400
        mockMvc.perform(post("/api/notifications/999999/read")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isBadRequest());

        // Guide A marks notifA1 as read -> 200
        mockMvc.perform(post("/api/notifications/" + notifA1.getId() + "/read")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(notifA1.getId()))
                .andExpect(jsonPath("$.data.read").value(true));

        // Guide A marks all as read -> 200, unreadCount becomes 0, Guide B's notifB remains unread
        mockMvc.perform(post("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200));

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(0));

        assertTrue(notificationRepository.findById(notifA2.getId()).orElseThrow().getRead());
        assertFalse(notificationRepository.findById(notifB.getId()).orElseThrow().getRead());

        // Guide B still sees their own unread notification
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }
}
