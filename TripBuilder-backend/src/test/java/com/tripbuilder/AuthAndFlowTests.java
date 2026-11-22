package com.tripbuilder;

import com.tripbuilder.dto.request.auth.LoginRequest;
import com.tripbuilder.dto.request.booking.BookingStepRequest;
import com.tripbuilder.dto.request.booking.CreateBookingRequest;
import com.tripbuilder.dto.request.booking.CustomizeRequest;
import com.tripbuilder.dto.request.booking.RequoteRequest;
import com.tripbuilder.dto.request.tour.SaveTourRequest;
import com.tripbuilder.dto.request.tour.TourStepRequest;
import com.tripbuilder.entity.booking.BookingStatus;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.exception.BadRequestException;
import com.tripbuilder.exception.ForbiddenException;
import com.tripbuilder.service.auth.AuthService;
import com.tripbuilder.service.booking.BookingService;
import com.tripbuilder.service.tour.TourService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Base64;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("h2")
@TestPropertySource(properties = {
        "spring.datasource.url=jdbc:h2:mem:testdb;MODE=MSSQLServer;DB_CLOSE_DELAY=-1",
        "spring.jpa.hibernate.ddl-auto=create-drop"
})
class AuthAndFlowTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AuthService authService;

    @Autowired
    private TourService tourService;

    @Autowired
    private BookingService bookingService;

    @Value("${app.auth.secret:tripbuilder-local-dev-secret-2026-hmac-key}")
    private String authSecret;

    @Test
    void enforcesRoleSeparationAcrossEndpoints() throws Exception {
        var customerAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER));
        var guideAuth = authService.login(new LoginRequest("binh.guide@tripbuilder.vn", "123456", Role.GUIDE));

        // Cross-portal login is rejected with 403
        assertThrows(ForbiddenException.class, () ->
                authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.GUIDE)));
        assertThrows(ForbiddenException.class, () ->
                authService.login(new LoginRequest("binh.guide@tripbuilder.vn", "123456", Role.CUSTOMER)));

        // Unauthenticated bookings call returns 401
        mockMvc.perform(get("/api/bookings"))
                .andExpect(status().isUnauthorized());

        // Customer cannot create a preset tour -> 403
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + customerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\":\"Hack\",\"regionId\":1,\"days\":2,\"steps\":[]}"))
                .andExpect(status().isForbidden());

        // Guide cannot create a customer booking -> 403
        mockMvc.perform(post("/api/bookings")
                        .header("Authorization", "Bearer " + guideAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tourId\":1,\"days\":2,\"guests\":2}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void supportsMultiRoundPostConfirmAndTourSnapshotVersioning() {
        var customer = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER)).user();
        var tour = tourService.list(null).get(0);
        int initialVer = tour.version();

        var created = bookingService.create(new CreateBookingRequest(
                tour.id(), customer.id(), LocalDate.now().plusDays(10),
                tour.days(), 2, "COMPANION", "Đặt thử", false, null
        ));
        assertEquals(initialVer, created.tourVersionSnapshot());

        // Guide updates preset tour -> version increments, booking keeps snapshot version
        var updatedTour = tourService.update(tour.id(), new SaveTourRequest(
                tour.guide().id(), tour.regionId(), tour.title() + " v2",
                tour.description(), tour.imageUrl(), tour.galleryUrls(), tour.days(),
                tour.steps().stream()
                        .map(s -> new TourStepRequest(s.dayNumber(), s.category(), s.title(), s.pricePerPerson() + 50_000, s.imageUrl()))
                        .toList()
        ), null);
        assertEquals(initialVer + 1, updatedTour.version());

        var reloadedBooking = bookingService.get(created.id(), null);
        assertEquals(initialVer, reloadedBooking.tourVersionSnapshot());
        assertEquals(initialVer + 1, reloadedBooking.latestTourVersion());

        // Confirm, then customer requests post-confirm change -> CHANGE_REQUESTED -> Guide requotes -> REQUOTED -> Confirm
        var confirmed = bookingService.confirm(created.id());
        assertEquals(BookingStatus.CONFIRMED, confirmed.status());

        var changedAfterConfirm = bookingService.customize(created.id(), new CustomizeRequest(
                confirmed.startDate(), confirmed.days(), 3, "COMPANION", "Tăng lên 3 người",
                confirmed.steps().stream()
                        .map(s -> new BookingStepRequest(s.dayNumber(), s.category(), s.title(), s.pricePerPerson(), s.originalTitle(), s.originalPricePerPerson(), s.noteType(), s.imageUrl()))
                        .toList()
        ), null);
        assertEquals(BookingStatus.CHANGE_REQUESTED, changedAfterConfirm.status());
        assertTrue(changedAfterConfirm.postConfirmAdjustment());

        var requoted = bookingService.requote(created.id(), new RequoteRequest(
                changedAfterConfirm.days(), 3, -150_000L, "Đã giữ thêm phòng cho 3 khách",
                changedAfterConfirm.steps().stream()
                        .map(s -> new BookingStepRequest(s.dayNumber(), s.category(), s.title(), s.pricePerPerson(), s.originalTitle(), s.originalPricePerPerson(), s.noteType(), s.imageUrl()))
                        .toList()
        ));
        assertEquals(BookingStatus.REQUOTED, requoted.status());

        var reconfirmed = bookingService.confirm(created.id());
        assertEquals(BookingStatus.CONFIRMED, reconfirmed.status());
        assertFalse(reconfirmed.postConfirmAdjustment());
    }

    @Test
    void preventsClientSidePriceTamperingOnPresetAndModifiedSteps() {
        var customer = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER)).user();
        var tour = tourService.list(null).stream()
                .filter(t -> t.title().contains("Hạ Long"))
                .findFirst()
                .orElseThrow();

        var firstStep = tour.steps().get(0);
        // Client tries to tamper PRESET price to 0đ and MODIFIED PresetOption price to 1đ
        var tamperedSteps = List.of(
                new BookingStepRequest(firstStep.dayNumber(), firstStep.category(), firstStep.title(),
                        0L, firstStep.title(), 0L, "PRESET", firstStep.imageUrl()),
                new BookingStepRequest(1, "Khách sạn", "Du thuyền Paradise 5★ ngủ đêm trên vịnh",
                        1L, "Khách sạn Mường Thanh 4★ hướng vịnh", 0L, "MODIFIED", null)
        );

        var booking = bookingService.create(new CreateBookingRequest(
                tour.id(), customer.id(), LocalDate.now().plusDays(12),
                tour.days(), 2, "COMPANION", "Test chống sửa giá", true, tamperedSteps
        ));

        assertEquals(BookingStatus.WAITING_REQUOTE, booking.status());
        assertEquals(firstStep.pricePerPerson(), booking.steps().get(0).pricePerPerson());
        assertEquals(1_800_000L, booking.steps().get(1).pricePerPerson());
        assertEquals(700_000L, booking.steps().get(1).originalPricePerPerson());
        assertEquals(firstStep.pricePerPerson() + 1_800_000L, booking.currentPricePerPerson());
        assertEquals((firstStep.pricePerPerson() + 1_800_000L) * 2, booking.totalPrice());
    }

    @Test
    void rejectsConfirmWhenBookingIsWaitingRequoteOrChangeRequested() {
        var customer = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER)).user();
        var tour = tourService.list(null).get(0);

        // 1. WAITING_REQUOTE -> confirm() must throw BadRequestException
        var customBooking = bookingService.create(new CreateBookingRequest(
                tour.id(), customer.id(), LocalDate.now().plusDays(10),
                tour.days(), 2, "COMPANION", "Chờ báo giá", true,
                List.of(new BookingStepRequest(1, "Yêu cầu thêm", "Đặt hoa kỷ niệm", 500_000L, null, 0L, "CUSTOM", null))
        ));
        assertEquals(BookingStatus.WAITING_REQUOTE, customBooking.status());
        // Customer's CUSTOM price must also be forced to 0đ
        assertEquals(0L, customBooking.steps().get(0).pricePerPerson());
        assertThrows(BadRequestException.class, () -> bookingService.confirm(customBooking.id()));

        // 2. CONFIRMED -> customize() -> CHANGE_REQUESTED -> confirm() must throw BadRequestException
        var presetBooking = bookingService.create(new CreateBookingRequest(
                tour.id(), customer.id(), LocalDate.now().plusDays(11),
                tour.days(), 2, "COMPANION", null, false, null
        ));
        bookingService.confirm(presetBooking.id());

        var changeRequested = bookingService.customize(presetBooking.id(), new CustomizeRequest(
                presetBooking.startDate(), presetBooking.days(), 3, "COMPANION", "Thêm 1 khách",
                presetBooking.steps().stream()
                        .map(s -> new BookingStepRequest(s.dayNumber(), s.category(), s.title(), s.pricePerPerson(),
                                s.originalTitle(), s.originalPricePerPerson(), s.noteType(), s.imageUrl()))
                        .toList()
        ), null);
        assertEquals(BookingStatus.CHANGE_REQUESTED, changeRequested.status());
        assertThrows(BadRequestException.class, () -> bookingService.confirm(presetBooking.id()));
    }

    @Test
    void requoteAutoPromotesPricedCustomToGuideAndRejectsUnpricedCustom() {
        var customer = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER)).user();
        var tour = tourService.list(null).get(0);

        var booking = bookingService.create(new CreateBookingRequest(
                tour.id(), customer.id(), LocalDate.now().plusDays(14),
                tour.days(), 2, "COMPANION", "Có yêu cầu riêng", true,
                List.of(
                        new BookingStepRequest(1, tour.steps().get(0).category(), tour.steps().get(0).title(),
                                tour.steps().get(0).pricePerPerson(), tour.steps().get(0).title(),
                                tour.steps().get(0).pricePerPerson(), "PRESET", tour.steps().get(0).imageUrl()),
                        new BookingStepRequest(1, "Yêu cầu thêm", "Chụp ảnh Flycam", 0L, null, 0L, "CUSTOM", null)
                )
        ));

        // Unpriced CUSTOM (0đ) must be rejected when Guide tries to requote
        assertThrows(BadRequestException.class, () -> bookingService.requote(booking.id(), new RequoteRequest(
                booking.days(), booking.guests(), 0L, "Chưa nhập giá",
                booking.steps().stream()
                        .map(s -> new BookingStepRequest(s.dayNumber(), s.category(), s.title(), s.pricePerPerson(),
                                s.originalTitle(), s.originalPricePerPerson(), s.noteType(), s.imageUrl()))
                        .toList()
        )));

        // Priced CUSTOM (> 0đ) is auto-promoted to GUIDE
        var pricedSteps = List.of(
                new BookingStepRequest(1, booking.steps().get(0).category(), booking.steps().get(0).title(),
                        booking.steps().get(0).pricePerPerson(), booking.steps().get(0).originalTitle(),
                        booking.steps().get(0).originalPricePerPerson(), "PRESET", booking.steps().get(0).imageUrl()),
                new BookingStepRequest(1, "Yêu cầu thêm", "Chụp ảnh Flycam", 600_000L, null, 0L, "CUSTOM", null)
        );
        var requoted = bookingService.requote(booking.id(), new RequoteRequest(
                booking.days(), booking.guests(), 0L, "Đã báo giá Flycam", pricedSteps
        ));
        assertEquals(BookingStatus.REQUOTED, requoted.status());
        assertEquals("GUIDE", requoted.steps().get(1).noteType());
        assertEquals(600_000L, requoted.steps().get(1).pricePerPerson());
    }

    @Test
    void acceptAlternativeOnRequotedBookingKeepsRequotedAndAllowsConfirm() {
        var hoa = authService.login(new LoginRequest("hoa.do@gmail.com", "123456", Role.CUSTOMER)).user();
        var bk0002 = bookingService.list(hoa.id(), null).stream()
                .filter(b -> "BK-0002".equals(b.code()))
                .findFirst()
                .orElseThrow();
        assertEquals(BookingStatus.REQUOTED, bk0002.status());

        // Customer accepts ALTERNATIVE step (noteType ALTERNATIVE -> GUIDE) without changing anything else
        var acceptedSteps = bk0002.steps().stream()
                .map(s -> new BookingStepRequest(
                        s.dayNumber(), s.category(), s.title(), s.pricePerPerson(),
                        s.originalTitle(), s.originalPricePerPerson(),
                        "ALTERNATIVE".equals(s.noteType()) ? "GUIDE" : s.noteType(),
                        s.imageUrl()
                ))
                .toList();

        var afterAccept = bookingService.customize(bk0002.id(), new CustomizeRequest(
                bk0002.startDate(), bk0002.days(), bk0002.guests(), bk0002.serviceMode(),
                "Đồng ý phương án thay thế từ Guide.", acceptedSteps
        ), null);

        assertEquals(BookingStatus.REQUOTED, afterAccept.status());
        assertEquals(bk0002.totalPrice(), afterAccept.totalPrice());
        assertTrue(afterAccept.steps().stream().noneMatch(s -> "ALTERNATIVE".equals(s.noteType())));

        var confirmed = bookingService.confirm(bk0002.id());
        assertEquals(BookingStatus.CONFIRMED, confirmed.status());
    }

    @Test
    void malformedBase64TokenReturns401AndUsersEndpointOmitsPhone() throws Exception {
        // 1. Invalid token format / malformed Base64 returns 401 (never 500)
        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer @@@invalid_base64@@@.invalidsig"))
                .andExpect(status().isUnauthorized());

        String badPayload = "not!valid!base64";
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(authSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String sig = Base64.getUrlEncoder().withoutPadding()
                .encodeToString(mac.doFinal(badPayload.getBytes(StandardCharsets.UTF_8)));

        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + badPayload + "." + sig))
                .andExpect(status().isUnauthorized());

        // 2. GET /api/auth/demo-accounts?role=CUSTOMER returns DemoAccountDto without phone
        mockMvc.perform(get("/api/auth/demo-accounts").param("role", "CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].email").exists())
                .andExpect(jsonPath("$.data[0].phone").doesNotExist());
    }

    @Test
    void savedToursApiSupportsCustomerCrudAndRejectsGuide() throws Exception {
        var customerAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER));
        var guideAuth = authService.login(new LoginRequest("binh.guide@tripbuilder.vn", "123456", Role.GUIDE));

        // Unauthenticated -> 401
        mockMvc.perform(get("/api/favorites"))
                .andExpect(status().isUnauthorized());

        // Guide -> 403
        mockMvc.perform(get("/api/favorites")
                        .header("Authorization", "Bearer " + guideAuth.token()))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/favorites/1")
                        .header("Authorization", "Bearer " + guideAuth.token()))
                .andExpect(status().isForbidden());

        // Customer has 2 seeded favorites initially
        mockMvc.perform(get("/api/favorites")
                        .header("Authorization", "Bearer " + customerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));

        // Find a tour not yet in An's favorites
        var allTours = tourService.list(null);
        Long targetTourId = allTours.get(allTours.size() - 1).id();

        // Save (and repeat idempotently)
        mockMvc.perform(post("/api/favorites/" + targetTourId)
                        .header("Authorization", "Bearer " + customerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3));
        mockMvc.perform(post("/api/favorites/" + targetTourId)
                        .header("Authorization", "Bearer " + customerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3));

        // Delete (and repeat idempotently)
        mockMvc.perform(delete("/api/favorites/" + targetTourId)
                        .header("Authorization", "Bearer " + customerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
        mockMvc.perform(delete("/api/favorites/" + targetTourId)
                        .header("Authorization", "Bearer " + customerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2));
    }

    @Test
    void regionPhotosAndTourGalleryItemsExposeLocalRealMedia() throws Exception {
        // Regions include photoCount >= 10 and previewPhotos
        mockMvc.perform(get("/api/regions"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(6))
                .andExpect(jsonPath("$.data[0].photoCount").value(11))
                .andExpect(jsonPath("$.data[0].previewPhotos.length()").value(4));

        // Region photos endpoint + category filter
        mockMvc.perform(get("/api/regions/1/photos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(11))
                .andExpect(jsonPath("$.data[0].landmarkName").exists());

        mockMvc.perform(get("/api/regions/1/photos").param("category", "Ẩm thực"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].category").value("Ẩm thực"));

        // Global photos endpoint includes 66 region + 6 shared activities = 72
        mockMvc.perform(get("/api/regions/photos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(72));

        // Tours have >= 10 galleryItems and no unsplash URLs
        var tours = tourService.list(null);
        assertFalse(tours.isEmpty());
        for (var t : tours) {
            assertTrue(t.galleryItems().size() >= 10, "Tour " + t.title() + " must have >= 10 galleryItems");
            assertFalse(t.imageUrl().contains("unsplash.com"));
            assertTrue(t.galleryUrls().stream().noneMatch(u -> u.contains("unsplash.com")));
        }

        // Static image serving works
        mockMvc.perform(get("/images/tours/ha-long/01-bay-panorama.jpg"))
                .andExpect(status().isOk());
    }

    @Test
    void tourGalleryPreservesOrderAndValidatesSafetyAndLimit() {
        var guide = authService.login(new LoginRequest("binh.guide@tripbuilder.vn", "123456", Role.GUIDE)).user();
        var validSteps = List.of(new TourStepRequest(1, "Trải nghiệm", "Tham quan", 300_000L, null));

        var orderedGallery = List.of(
                "/images/tours/ha-long/05-kayak-luon-cave.jpg",
                "/images/tours/ha-long/04-cruise-bay.jpg",
                "/images/tours/ha-long/10-ha-long-seafood.jpg"
        );
        var created = tourService.create(new SaveTourRequest(
                guide.id(), 1L, "Test Gallery Order", "Mô tả",
                "/images/tours/ha-long/02-titop-island.jpg",
                orderedGallery, 2, validSteps
        ));
        assertEquals(List.of(
                "/images/tours/ha-long/02-titop-island.jpg",
                "/images/tours/ha-long/05-kayak-luon-cave.jpg",
                "/images/tours/ha-long/04-cruise-bay.jpg",
                "/images/tours/ha-long/10-ha-long-seafood.jpg"
        ), created.galleryUrls());

        // Rejects pipe character
        assertThrows(BadRequestException.class, () -> tourService.create(new SaveTourRequest(
                guide.id(), 1L, "Bad Pipe", "Mô tả",
                "/images/tours/ha-long/01-bay-panorama.jpg",
                List.of("/images/a.jpg|/images/b.jpg"), 2, validSteps
        )));

        // Rejects javascript: URL
        assertThrows(BadRequestException.class, () -> tourService.create(new SaveTourRequest(
                guide.id(), 1L, "Bad JS", "Mô tả",
                "/images/tours/ha-long/01-bay-panorama.jpg",
                List.of("javascript:alert(1)"), 2, validSteps
        )));

        // Rejects > 20 gallery images (cover + 20 distinct = 21)
        List<String> tooMany = java.util.stream.IntStream.rangeClosed(1, 21)
                .mapToObj(i -> "/images/tours/ha-long/extra-" + i + ".jpg")
                .toList();
        assertThrows(BadRequestException.class, () -> tourService.create(new SaveTourRequest(
                guide.id(), 1L, "Too Many", "Mô tả",
                "/images/tours/ha-long/01-bay-panorama.jpg",
                tooMany, 2, validSteps
        )));
    }

    @Test
    void tourListSupportsFilteringByRegionDaysKeywordAndSorting() throws Exception {
        // Filter by regionId=2 (Đà Lạt), minDays=3, q=Cầu Đất
        mockMvc.perform(get("/api/tours")
                        .param("regionId", "2")
                        .param("minDays", "3")
                        .param("q", "Cầu Đất"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].regionName").value("Đà Lạt"));

        // Sort price_asc
        var asc = tourService.list(null, null, null, null, null, "price_asc");
        for (int i = 1; i < asc.size(); i++) {
            assertTrue(asc.get(i - 1).basePricePerPerson() <= asc.get(i).basePricePerPerson());
        }

        // Sort price_desc
        var desc = tourService.list(null, null, null, null, null, "price_desc");
        for (int i = 1; i < desc.size(); i++) {
            assertTrue(desc.get(i - 1).basePricePerPerson() >= desc.get(i).basePricePerPerson());
        }
    }

    @Test
    void supportsCustomerRegistrationAndAdminPortalOverview() throws Exception {
        // 1. Register new customer via POST /api/auth/register
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Khách Mới\",\"email\":\"new.customer@gmail.com\",\"password\":\"123456\",\"phone\":\"0909888777\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.data.user.email").value("new.customer@gmail.com"));

        // Duplicate email -> 400
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Khách Trùng\",\"email\":\"new.customer@gmail.com\",\"password\":\"123456\",\"phone\":\"0909888777\"}"))
                .andExpect(status().isBadRequest());

        // 2. Admin login & cross-portal protection
        var adminAuth = authService.login(new LoginRequest("admin@tripbuilder.vn", "123456", Role.ADMIN));
        assertEquals(Role.ADMIN, adminAuth.user().role());
        assertThrows(ForbiddenException.class, () ->
                authService.login(new LoginRequest("admin@tripbuilder.vn", "123456", Role.CUSTOMER)));
        assertThrows(ForbiddenException.class, () ->
                authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.ADMIN)));

        // 3. /api/admin/overview authorization & payload
        mockMvc.perform(get("/api/admin/overview"))
                .andExpect(status().isUnauthorized());

        var customerAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER));
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + customerAuth.token()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + adminAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalRegions").value(6))
                .andExpect(jsonPath("$.data.totalTours").exists())
                .andExpect(jsonPath("$.data.totalBookings").exists())
                .andExpect(jsonPath("$.data.totalPresetOptions").exists());
    }

    @Test
    void qaBreakerHardeningTestsPassWithout500OrSecurityLeaks() throws Exception {
        var customerAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER));
        var guideAuth = authService.login(new LoginRequest("binh.guide@tripbuilder.vn", "123456", Role.GUIDE));
        var adminAuth = authService.login(new LoginRequest("admin@tripbuilder.vn", "123456", Role.ADMIN));

        // 1. Malformed JSON, invalid enum, missing query param -> 400 (never 500)
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(""))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"an.nguyen@gmail.com\",\"password\":\"123456\",\"expectedRole\":\"INVALID_ROLE\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/options"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/auth/demo-accounts"))
                .andExpect(status().isBadRequest());

        // 2. Null element in steps -> 400 (never NPE 500)
        mockMvc.perform(post("/api/tours")
                        .header("Authorization", "Bearer " + guideAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"regionId\":1,\"title\":\"Test Null Step\",\"days\":2,\"steps\":[null]}"))
                .andExpect(status().isBadRequest());

        // 3. Registered real customer does NOT leak into demo-accounts; weak password/bad email rejected
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Bad\",\"email\":\"abc\",\"password\":\"1\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Real Privacy User\",\"email\":\"real.privacy@gmail.com\",\"password\":\"StrongPass99\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/auth/demo-accounts").param("role", "CUSTOMER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.email=='real.privacy@gmail.com')]").isEmpty());

        // 4. Review rating bounds & length > 1000 -> 400
        String over1000 = "A".repeat(1200);
        mockMvc.perform(post("/api/bookings/4/review")
                        .header("Authorization", "Bearer " + customerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":-999,\"review\":\"bad\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/bookings/4/review")
                        .header("Authorization", "Bearer " + customerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"review\":\"" + over1000 + "\"}"))
                .andExpect(status().isBadRequest());

        // 5. Category normalization: HOTEL -> "Khách sạn"
        mockMvc.perform(post("/api/admin/preset-options")
                        .header("Authorization", "Bearer " + adminAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"regionId\":1,\"category\":\"HOTEL\",\"title\":\"Normalized Hotel Test\",\"pricePerPerson\":500000}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.category").value("Khách sạn"));

        // 6. Admin can list and view bookings -> 200
        mockMvc.perform(get("/api/bookings")
                        .header("Authorization", "Bearer " + adminAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThan(0)));
        mockMvc.perform(get("/api/bookings/1")
                        .header("Authorization", "Bearer " + adminAuth.token()))
                .andExpect(status().isOk());
    }
}
