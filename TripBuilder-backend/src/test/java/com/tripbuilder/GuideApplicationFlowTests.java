package com.tripbuilder;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.tripbuilder.dto.request.auth.LoginRequest;
import com.tripbuilder.entity.guide.GuideApplicationStatus;
import com.tripbuilder.entity.region.Region;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.repository.GuideApplicationRepository;
import com.tripbuilder.repository.NotificationRepository;
import com.tripbuilder.repository.RegionRepository;
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

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb_guide_app;MODE=MSSQLServer;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class GuideApplicationFlowTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Autowired
    private RegionRepository regionRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private GuideApplicationRepository guideApplicationRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void fullGuideApplicationApproveAndRejectFlows() throws Exception {
        Region daLat = regionRepository.findByCode("da-lat").orElseThrow();
        Region hoiAn = regionRepository.findByCode("hoi-an").orElseThrow();

        // 1. Ứng viên nộp hồ sơ thành công
        String applyPayload = """
                {
                  "fullName": "Phạm Ngọc Mai",
                  "email": "mai.guide.apply@tripbuilder.vn",
                  "phone": "0912345999",
                  "password": "GuidePass123",
                  "confirmPassword": "GuidePass123",
                  "regionId": %d,
                  "yearsExperience": 4,
                  "licenseNumber": "HDV-LD-2026-099",
                  "languages": "Tiếng Việt, Tiếng Anh",
                  "bio": "Hướng dẫn viên bản địa Đà Lạt 4 năm kinh nghiệm dẫn tour trekking và văn hoá cà phê.",
                  "acceptedTerms": true
                }
                """.formatted(daLat.getId());

        MvcResult submitResult = mockMvc.perform(post("/api/guide-applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(applyPayload))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.status").value("PENDING"))
                .andExpect(jsonPath("$.data.regionName").value("Đà Lạt"))
                .andReturn();

        JsonNode submitJson = objectMapper.readTree(submitResult.getResponse().getContentAsString());
        String appCode = submitJson.path("data").path("applicationCode").asText();
        assertTrue(appCode.startsWith("GA-2026-"));

        // 2. Tra cứu trạng thái public trả về PENDING
        mockMvc.perform(post("/api/guide-applications/lookup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "mai.guide.apply@tripbuilder.vn", "applicationCode": "%s"}
                                """.formatted(appCode)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));

        // 3. Thử đăng nhập GUIDE khi đang PENDING -> báo đang chờ xét duyệt
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "mai.guide.apply@tripbuilder.vn", "password": "GuidePass123", "expectedRole": "GUIDE"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("chờ Admin xét duyệt")));

        // 4. Chặn trùng email khi đang PENDING
        mockMvc.perform(post("/api/guide-applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(applyPayload))
                .andExpect(status().isBadRequest());

        // 5. Không phải ADMIN không gọi được /api/admin/guide-applications
        var customerAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, false));
        mockMvc.perform(get("/api/admin/guide-applications")
                        .header("Authorization", "Bearer " + customerAuth.token()))
                .andExpect(status().isForbidden());

        // 6. Admin xem danh sách PENDING & duyệt hồ sơ
        var adminAuth = authService.login(new LoginRequest("admin@tripbuilder.vn", "123456", Role.ADMIN, false));
        MvcResult listResult = mockMvc.perform(get("/api/admin/guide-applications?status=PENDING")
                        .header("Authorization", "Bearer " + adminAuth.token()))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode listJson = objectMapper.readTree(listResult.getResponse().getContentAsString()).path("data");
        long appId = -1;
        for (JsonNode item : listJson) {
            if (appCode.equals(item.path("applicationCode").asText())) {
                appId = item.path("id").asLong();
                break;
            }
        }
        assertTrue(appId > 0);

        mockMvc.perform(post("/api/admin/guide-applications/" + appId + "/approve")
                        .header("Authorization", "Bearer " + adminAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"regionId": %d, "reviewNote": "Đủ điều kiện cấp tài khoản HDV."}
                                """.formatted(daLat.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("APPROVED"));

        // 7. Tài khoản GUIDE mới đã được tạo đúng vùng & đăng nhập thành công + có notification chào mừng
        var createdUser = userRepository.findByEmailIgnoreCase("mai.guide.apply@tripbuilder.vn").orElseThrow();
        assertEquals(Role.GUIDE, createdUser.getRole());
        assertEquals(daLat.getId(), createdUser.getRegion().getId());
        assertTrue(notificationRepository.countByRecipientIdAndReadFalse(createdUser.getId()) >= 1);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "mai.guide.apply@tripbuilder.vn", "password": "GuidePass123", "expectedRole": "GUIDE"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.user.role").value("GUIDE"))
                .andExpect(jsonPath("$.data.user.regionName").value("Đà Lạt"));

        // 8. Chặn nộp trùng email đã tồn tại AppUser
        mockMvc.perform(post("/api/guide-applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(applyPayload))
                .andExpect(status().isBadRequest());

        // 9. Luồng từ chối & nộp lại hồ sơ mới bằng chính email đó
        String rejectCandidateEmail = "tuan.hoian.apply@tripbuilder.vn";
        String secondPayload = """
                {
                  "fullName": "Trần Minh Tuấn",
                  "email": "%s",
                  "phone": "0905678123",
                  "password": "GuidePass123",
                  "confirmPassword": "GuidePass123",
                  "regionId": %d,
                  "yearsExperience": 2,
                  "licenseNumber": "",
                  "languages": "Tiếng Việt",
                  "bio": "Sinh ra tại Quảng Nam và am hiểu phố cổ Hội An, mong muốn hợp tác dẫn tour.",
                  "acceptedTerms": true
                }
                """.formatted(rejectCandidateEmail, hoiAn.getId());

        MvcResult secondRes = mockMvc.perform(post("/api/guide-applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(secondPayload))
                .andExpect(status().isOk())
                .andReturn();
        String secondCode = objectMapper.readTree(secondRes.getResponse().getContentAsString())
                .path("data").path("applicationCode").asText();
        Long secondId = guideApplicationRepository
                .findByEmailIgnoreCaseAndApplicationCodeIgnoreCase(rejectCandidateEmail, secondCode)
                .orElseThrow().getId();

        // Reject thiếu lý do -> 400
        mockMvc.perform(post("/api/admin/guide-applications/" + secondId + "/reject")
                        .header("Authorization", "Bearer " + adminAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewNote\":\"\"}"))
                .andExpect(status().isBadRequest());

        // Reject có lý do -> REJECTED
        mockMvc.perform(post("/api/admin/guide-applications/" + secondId + "/reject")
                        .header("Authorization", "Bearer " + adminAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reviewNote\":\"Thiếu thông tin thẻ hướng dẫn viên.\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REJECTED"));

        // Thử đăng nhập GUIDE sau khi bị từ chối -> 401 kèm lý do
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s", "password": "GuidePass123", "expectedRole": "GUIDE"}
                                """.formatted(rejectCandidateEmail)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("Thiếu thông tin thẻ hướng dẫn viên")));

        // Nộp lại hồ sơ mới bằng chính email đó -> thành công!
        mockMvc.perform(post("/api/guide-applications")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(secondPayload.replace("\"licenseNumber\": \"\"", "\"licenseNumber\": \"HDV-QN-2025-118\"")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("PENDING"));
        assertTrue(guideApplicationRepository.countByStatus(GuideApplicationStatus.PENDING) >= 1);
    }
}
