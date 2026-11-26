package com.tripbuilder;

import com.tripbuilder.dto.request.auth.LoginRequest;
import com.tripbuilder.entity.user.Role;
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

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb_audit_2;MODE=MSSQLServer;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class ApiAuditBookingTourTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private String loginToken(String email, Role role) {
        return authService.login(new LoginRequest(email, "123456", role, false)).token();
    }

    private JsonNode readData(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("data");
    }

    private long createFreshTourAsGuide(String guideToken, String title, int days) throws Exception {
        String body = """
                {
                  "regionId": 999,
                  "title": "%s",
                  "description": "Hành trình trải nghiệm bản địa",
                  "days": %d,
                  "steps": [
                    {
                      "dayNumber": 1,
                      "category": "Khám phá",
                      "title": "Tham quan điểm nổi bật",
                      "pricePerPerson": 450000
                    }
                  ]
                }
                """.formatted(title, days);
        MvcResult res = mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + guideToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.id").isNumber())
                .andReturn();
        return readData(res).get("id").asLong();
    }

    private long createRemoteBooking(String customerToken, long tourId, LocalDate startDate) throws Exception {
        String body = """
                {
                  "tourId": %d,
                  "startDate": "%s",
                  "days": 2,
                  "guests": 2,
                  "serviceMode": "REMOTE",
                  "customerNote": "Đặt test audit"
                }
                """.formatted(tourId, startDate);
        MvcResult res = mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.id").isNumber())
                .andReturn();
        return readData(res).get("id").asLong();
    }

    // ==================== 1. TourController: GET list & detail ====================

    @Test
    void tourListAndGetPublicFiltersSortAndInactiveVisibility() throws Exception {
        MvcResult listRes = mockMvc.perform(get("/api/tours"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data").isArray())
                .andReturn();

        JsonNode tours = readData(listRes);
        assertFalse(tours.isEmpty());
        long firstTourId = tours.get(0).get("id").asLong();
        long regionId = tours.get(0).get("regionId").asLong();

        // Filters + all sort modes
        mockMvc.perform(get("/api/tours")
                        .param("regionId", String.valueOf(regionId))
                        .param("minDays", "1")
                        .param("maxDays", "10")
                        .param("q", "a")
                        .param("sort", "price_asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data").isArray());

        for (String sort : new String[]{"price_desc", "days_asc", "days_desc", "newest"}) {
            mockMvc.perform(get("/api/tours").param("sort", sort))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.statusCode").value(200));
        }

        // Detail happy path
        mockMvc.perform(get("/api/tours/" + firstTourId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.id").value(firstTourId));

        // Non-existent ID & malformed ID -> 400 (never 500)
        mockMvc.perform(get("/api/tours/999999"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));
        mockMvc.perform(get("/api/tours/not-a-number"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.statusCode").value(400));
    }

    // ==================== 2. TourController: POST, PUT, PATCH, DELETE ====================

    @Test
    void tourCrudAuthRbacIdorAndValidation() throws Exception {
        String customerToken = loginToken("an.nguyen@gmail.com", Role.CUSTOMER);
        String guideAToken = loginToken("binh.guide@tripbuilder.vn", Role.GUIDE);
        String guideBToken = loginToken("chi.guide@tripbuilder.vn", Role.GUIDE);
        String adminToken = loginToken("admin@tripbuilder.vn", Role.ADMIN);

        String validCreateBody = """
                {
                  "regionId": 999,
                  "title": "Tour Audit Hạ Long",
                  "description": "Mô tả tour test",
                  "days": 2,
                  "steps": [
                    {
                      "dayNumber": 1,
                      "category": "Tham quan",
                      "title": "Du thuyền vịnh",
                      "pricePerPerson": 600000
                    }
                  ]
                }
                """;

        // POST /api/tours: 401 & 403
        mockMvc.perform(post("/api/tours")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateBody))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validCreateBody))
                .andExpect(status().isForbidden());

        // POST /api/tours: validation -> 400
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid-json"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"\",\"days\":2,\"steps\":[{\"dayNumber\":1,\"title\":\"Step\",\"pricePerPerson\":1000}]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Bad days 0\",\"days\":0,\"steps\":[{\"dayNumber\":1,\"title\":\"Step\",\"pricePerPerson\":1000}]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Bad days 11\",\"days\":11,\"steps\":[{\"dayNumber\":1,\"title\":\"Step\",\"pricePerPerson\":1000}]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Empty steps\",\"days\":2,\"steps\":[]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Negative price\",\"days\":2,\"steps\":[{\"dayNumber\":1,\"title\":\"Step\",\"pricePerPerson\":-100}]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"XSS Image\",\"imageUrl\":\"javascript:alert(1)\",\"days\":2,\"steps\":[{\"dayNumber\":1,\"title\":\"Step\",\"pricePerPerson\":1000}]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Bad dayNumber 0\",\"days\":2,\"steps\":[{\"dayNumber\":0,\"title\":\"Step\",\"pricePerPerson\":1000}]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Bad dayNumber 5\",\"days\":2,\"steps\":[{\"dayNumber\":5,\"title\":\"Step\",\"pricePerPerson\":1000}]}"))
                .andExpect(status().isBadRequest());

        // POST /api/tours: Happy path (guide's own region is enforced despite regionId=999)
        long tourId = createFreshTourAsGuide(guideAToken, "Tour Audit Hạ Long", 2);

        // PUT /api/tours/{id}: 401, 403 (customer, admin, other guide IDOR), 400 (non-existent), 200 (owner)
        String updateBody = """
                {
                  "title": "Tour Audit Hạ Long v2",
                  "description": "Cập nhật mô tả",
                  "days": 3,
                  "steps": [
                    {
                      "dayNumber": 1,
                      "category": "Ẩm thực",
                      "title": "Hải sản tối",
                      "pricePerPerson": 350000
                    }
                  ]
                }
                """;
        mockMvc.perform(put("/api/tours/" + tourId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/tours/" + tourId)
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/tours/" + tourId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/tours/" + tourId)
                        .header("Authorization", "Bearer " + guideBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/tours/999999")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/tours/" + tourId)
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.version").value(2))
                .andExpect(jsonPath("$.data.title").value("Tour Audit Hạ Long v2"));

        // PATCH /api/tours/{id}/status: 401, 403 (customer, other guide), 400 (null active), 200 (owner & admin)
        mockMvc.perform(patch("/api/tours/" + tourId + "/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(patch("/api/tours/" + tourId + "/status")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/tours/" + tourId + "/status")
                        .header("Authorization", "Bearer " + guideBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch("/api/tours/" + tourId + "/status")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        // Guide hides tour -> hidden from anonymous/customer, visible to owner & admin
        mockMvc.perform(patch("/api/tours/" + tourId + "/status")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));

        mockMvc.perform(get("/api/tours/" + tourId))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/tours/" + tourId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/tours/" + tourId)
                        .header("Authorization", "Bearer " + guideAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));
        mockMvc.perform(get("/api/tours/" + tourId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // Admin reactivates tour
        mockMvc.perform(patch("/api/tours/" + tourId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(true));

        // DELETE /api/tours/{id}: 401, 403 (customer, other guide), 200 (owner on tour with no bookings)
        mockMvc.perform(delete("/api/tours/" + tourId))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/tours/" + tourId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/tours/" + tourId)
                        .header("Authorization", "Bearer " + guideBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/tours/" + tourId)
                        .header("Authorization", "Bearer " + guideAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200));

        // Tour with existing booking cannot be deleted -> 400
        long tourWithBookingId = createFreshTourAsGuide(guideAToken, "Tour Có Đơn Đặt", 2);
        createRemoteBooking(customerToken, tourWithBookingId, LocalDate.now().plusDays(40));
        mockMvc.perform(delete("/api/tours/" + tourWithBookingId)
                        .header("Authorization", "Bearer " + guideAToken))
                .andExpect(status().isBadRequest());
    }

    // ==================== 3. FavoriteController ====================

    @Test
    void favoriteEndpointsAuthRbacAndIdempotency() throws Exception {
        String customerAToken = loginToken("an.nguyen@gmail.com", Role.CUSTOMER);
        String customerBToken = loginToken("hoa.do@gmail.com", Role.CUSTOMER);
        String guideToken = loginToken("binh.guide@tripbuilder.vn", Role.GUIDE);
        String adminToken = loginToken("admin@tripbuilder.vn", Role.ADMIN);

        long tourId = createFreshTourAsGuide(guideToken, "Tour Yêu Thích Audit", 2);

        // 401 without token
        mockMvc.perform(get("/api/favorites")).andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/favorites/" + tourId)).andExpect(status().isUnauthorized());
        mockMvc.perform(delete("/api/favorites/" + tourId)).andExpect(status().isUnauthorized());

        // 403 for non-CUSTOMER roles
        mockMvc.perform(get("/api/favorites").header("Authorization", "Bearer " + guideToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/favorites/" + tourId).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete("/api/favorites/" + tourId).header("Authorization", "Bearer " + guideToken))
                .andExpect(status().isForbidden());

        // 400 for non-existent tourId
        mockMvc.perform(post("/api/favorites/999999")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isBadRequest());

        // Happy path save + idempotent repeat save
        mockMvc.perform(post("/api/favorites/" + tourId)
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data").isArray());

        mockMvc.perform(post("/api/favorites/" + tourId)
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk());

        // List shows tourId for Customer A, isolated from Customer B
        MvcResult favARes = mockMvc.perform(get("/api/favorites")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andReturn();
        assertTrue(favARes.getResponse().getContentAsString().contains(String.valueOf(tourId)));

        MvcResult favBRes = mockMvc.perform(get("/api/favorites")
                        .header("Authorization", "Bearer " + customerBToken))
                .andExpect(status().isOk())
                .andReturn();
        assertFalse(readData(favBRes).toString().contains(String.valueOf(tourId)));

        // Delete + idempotent repeat delete
        mockMvc.perform(delete("/api/favorites/" + tourId)
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200));
        mockMvc.perform(delete("/api/favorites/" + tourId)
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk());
    }

    // ==================== 4. BookingController: list, get, create ====================

    @Test
    void bookingListGetCreateValidationAndIdor() throws Exception {
        String customerAToken = loginToken("an.nguyen@gmail.com", Role.CUSTOMER);
        String customerBToken = loginToken("hoa.do@gmail.com", Role.CUSTOMER);
        String guideAToken = loginToken("binh.guide@tripbuilder.vn", Role.GUIDE);
        String guideBToken = loginToken("chi.guide@tripbuilder.vn", Role.GUIDE);
        String adminToken = loginToken("admin@tripbuilder.vn", Role.ADMIN);

        long tourId = createFreshTourAsGuide(guideAToken, "Tour Booking Audit 1", 2);
        long bookingId = createRemoteBooking(customerAToken, tourId, LocalDate.now().plusDays(45));

        // GET /api/bookings: 401, 403 cross-user filter, 200 valid
        mockMvc.perform(get("/api/bookings")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + customerAToken)
                        .param("customerId", "999999"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + customerAToken)
                        .param("guideId", "1"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + guideAToken)
                        .param("customerId", "1"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + guideAToken)
                        .param("guideId", "999999"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200));
        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + guideAToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // GET /api/bookings/{id}: 401, 403 IDOR, 400 non-existent, 200 authorized
        mockMvc.perform(get("/api/bookings/" + bookingId)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/bookings/" + bookingId)
                        .header("Authorization", "Bearer " + customerBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/bookings/" + bookingId)
                        .header("Authorization", "Bearer " + guideBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/bookings/999999")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/bookings/" + bookingId)
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(bookingId));
        mockMvc.perform(get("/api/bookings/" + bookingId)
                        .header("Authorization", "Bearer " + guideAToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/bookings/" + bookingId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        // POST /api/bookings: 401, 403 (guide/admin), 400 validation boundaries
        mockMvc.perform(post("/api/bookings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tourId\":" + tourId + "}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tourId\":" + tourId + "}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tourId\":" + tourId + "}"))
                .andExpect(status().isForbidden());

        String futureDate = LocalDate.now().plusDays(50).toString();
        String pastDate = LocalDate.now().minusDays(1).toString();

        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tourId\":999999,\"startDate\":\"" + futureDate + "\",\"days\":2,\"guests\":2}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tourId\":" + tourId + ",\"startDate\":\"" + pastDate + "\",\"days\":2,\"guests\":2}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tourId\":" + tourId + ",\"startDate\":\"" + futureDate + "\",\"days\":2,\"adults\":2,\"children\":-1}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tourId\":" + tourId + ",\"startDate\":\"" + futureDate + "\",\"days\":0,\"guests\":2}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tourId\":" + tourId + ",\"startDate\":\"" + futureDate + "\",\"days\":2,\"guests\":0}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tourId\":" + tourId + ",\"startDate\":\"" + futureDate + "\",\"days\":2,\"guests\":31}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tourId\":" + tourId + ",\"startDate\":\"" + futureDate + "\",\"days\":2,\"adults\":0,\"children\":2}"))
                .andExpect(status().isBadRequest());
    }

    // ==================== 5. BookingController: State Machine & RBAC ====================

    @Test
    void bookingFullStateMachineAndInvalidTransitions() throws Exception {
        String customerAToken = loginToken("an.nguyen@gmail.com", Role.CUSTOMER);
        String customerBToken = loginToken("hoa.do@gmail.com", Role.CUSTOMER);
        String guideAToken = loginToken("binh.guide@tripbuilder.vn", Role.GUIDE);
        String guideBToken = loginToken("chi.guide@tripbuilder.vn", Role.GUIDE);
        String adminToken = loginToken("admin@tripbuilder.vn", Role.ADMIN);

        long tourId = createFreshTourAsGuide(guideAToken, "Tour State Machine Audit", 2);
        long bookingId = createRemoteBooking(customerAToken, tourId, LocalDate.now().plusDays(60));

        // Invalid early transitions on BOOKED_ORIGINAL
        mockMvc.perform(post("/api/bookings/" + bookingId + "/complete")
                        .header("Authorization", "Bearer " + guideAToken))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/review")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"review\":\"Sớm quá\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/reject-change")
                        .header("Authorization", "Bearer " + guideAToken))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/confirm")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isBadRequest()); // guideAccepted is false

        // PUT /api/bookings/{id}/customize: 401, 403, 400, 200 -> WAITING_REQUOTE
        String customizeBody = """
                {
                  "days": 2,
                  "guests": 3,
                  "serviceMode": "REMOTE",
                  "customerNote": "Thêm hoạt động chèo kayak",
                  "steps": [
                    {
                      "dayNumber": 1,
                      "category": "Khám phá",
                      "title": "Chèo kayak hang Luồn",
                      "pricePerPerson": 0,
                      "noteType": "CUSTOM"
                    }
                  ]
                }
                """;
        mockMvc.perform(put("/api/bookings/" + bookingId + "/customize")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(customizeBody))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/bookings/" + bookingId + "/customize")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(customizeBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/bookings/" + bookingId + "/customize")
                        .header("Authorization", "Bearer " + customerBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(customizeBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/bookings/" + bookingId + "/customize")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"days\":2,\"guests\":2,\"steps\":[]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/bookings/" + bookingId + "/customize")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(customizeBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("WAITING_REQUOTE"));

        // POST /api/bookings/{id}/accept: 401, 403 (customer/admin/other guide), 200
        mockMvc.perform(post("/api/bookings/" + bookingId + "/accept"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/accept")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/accept")
                        .header("Authorization", "Bearer " + guideBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/accept")
                        .header("Authorization", "Bearer " + guideAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.guideAccepted").value(true));

        // PUT /api/bookings/{id}/requote: 401, 403, 400 (unpriced CUSTOM / negative total), 200 -> REQUOTED
        String requoteBody = """
                {
                  "days": 2,
                  "guests": 3,
                  "groupAdjustment": 100000,
                  "guideNote": "Đã báo giá kayak",
                  "steps": [
                    {
                      "dayNumber": 1,
                      "category": "Khám phá",
                      "title": "Chèo kayak hang Luồn",
                      "pricePerPerson": 300000,
                      "noteType": "GUIDE"
                    }
                  ]
                }
                """;
        mockMvc.perform(put("/api/bookings/" + bookingId + "/requote")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requoteBody))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(put("/api/bookings/" + bookingId + "/requote")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requoteBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/bookings/" + bookingId + "/requote")
                        .header("Authorization", "Bearer " + guideBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requoteBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(put("/api/bookings/" + bookingId + "/requote")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"days\":2,\"guests\":3,\"groupAdjustment\":-999999999,\"steps\":[{\"dayNumber\":1,\"title\":\"Step\",\"pricePerPerson\":1000,\"noteType\":\"GUIDE\"}]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/bookings/" + bookingId + "/requote")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"days\":2,\"guests\":3,\"steps\":[{\"dayNumber\":1,\"title\":\"Unpriced\",\"pricePerPerson\":0,\"noteType\":\"CUSTOM\"}]}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(put("/api/bookings/" + bookingId + "/requote")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requoteBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("REQUOTED"))
                .andExpect(jsonPath("$.data.totalPrice").value(1000000));

        // POST /api/bookings/{id}/confirm: 401, 403, 200 -> CONFIRMED
        mockMvc.perform(post("/api/bookings/" + bookingId + "/confirm"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/confirm")
                        .header("Authorization", "Bearer " + guideAToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/confirm")
                        .header("Authorization", "Bearer " + customerBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/confirm")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.depositPaid").value(true))
                .andExpect(jsonPath("$.data.hasConfirmedSnapshot").value(true));

        // Requote directly while CONFIRMED -> 400
        mockMvc.perform(put("/api/bookings/" + bookingId + "/requote")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requoteBody))
                .andExpect(status().isBadRequest());

        // Post-confirm customize -> CHANGE_REQUESTED, then reject-change -> CONFIRMED
        mockMvc.perform(put("/api/bookings/" + bookingId + "/customize")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(customizeBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CHANGE_REQUESTED"))
                .andExpect(jsonPath("$.data.postConfirmAdjustment").value(true));

        mockMvc.perform(post("/api/bookings/" + bookingId + "/reject-change"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/reject-change")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/reject-change")
                        .header("Authorization", "Bearer " + guideBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/reject-change")
                        .header("Authorization", "Bearer " + guideAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.postConfirmAdjustment").value(false));

        // POST /api/bookings/{id}/complete: 401, 403 (customer/other guide), 200 -> COMPLETED
        mockMvc.perform(post("/api/bookings/" + bookingId + "/complete"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/complete")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/complete")
                        .header("Authorization", "Bearer " + guideBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/complete")
                        .header("Authorization", "Bearer " + guideAToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        // POST /api/bookings/{id}/review: 401, 403, 400 (rating bounds), 200
        mockMvc.perform(post("/api/bookings/" + bookingId + "/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"review\":\"Tuyệt vời\"}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/review")
                        .header("Authorization", "Bearer " + guideAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"review\":\"Tuyệt vời\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/review")
                        .header("Authorization", "Bearer " + customerBToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"review\":\"Tuyệt vời\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/review")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":0,\"review\":\"Rating 0\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/review")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":6,\"review\":\"Rating 6\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/review")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"review\":\"Chuyến đi rất đáng nhớ!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.customerRating").value(5));
        // Duplicate review on already-reviewed booking -> 400
        mockMvc.perform(post("/api/bookings/" + bookingId + "/review")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":4,\"review\":\"Thử đánh giá lại\"}"))
                .andExpect(status().isBadRequest());

        // COMPLETED booking cannot be customized or cancelled -> 400
        mockMvc.perform(put("/api/bookings/" + bookingId + "/customize")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(customizeBody))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isBadRequest());
    }

    // ==================== 6. BookingController: cancel ====================

    @Test
    void bookingCancelAuthIdorAndAlreadyCancelled() throws Exception {
        String customerAToken = loginToken("an.nguyen@gmail.com", Role.CUSTOMER);
        String customerBToken = loginToken("hoa.do@gmail.com", Role.CUSTOMER);
        String guideAToken = loginToken("binh.guide@tripbuilder.vn", Role.GUIDE);
        String guideBToken = loginToken("chi.guide@tripbuilder.vn", Role.GUIDE);

        long tourId = createFreshTourAsGuide(guideAToken, "Tour Cancel Audit", 2);
        long bookingId = createRemoteBooking(customerAToken, tourId, LocalDate.now().plusDays(75));

        // 401 & 403 IDOR
        mockMvc.perform(post("/api/bookings/" + bookingId + "/cancel"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + customerBToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + guideBToken))
                .andExpect(status().isForbidden());

        // Cancel with reason -> 200
        mockMvc.perform(post("/api/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + customerAToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Thay đổi kế hoạch cá nhân\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.statusCode").value(200))
                .andExpect(jsonPath("$.data.status").value("CANCELLED"));

        // Repeat cancel -> 400
        mockMvc.perform(post("/api/bookings/" + bookingId + "/cancel")
                        .header("Authorization", "Bearer " + customerAToken))
                .andExpect(status().isBadRequest());
    }
}
