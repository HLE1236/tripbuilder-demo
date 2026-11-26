package com.tripbuilder;

import com.tripbuilder.dto.request.admin.CreateUserRequest;
import com.tripbuilder.dto.request.auth.LoginRequest;
import com.tripbuilder.dto.request.booking.BookingStepRequest;
import com.tripbuilder.dto.request.booking.CreateBookingRequest;
import com.tripbuilder.dto.request.booking.CustomizeRequest;
import com.tripbuilder.dto.request.booking.RequoteRequest;
import com.tripbuilder.dto.request.tour.SaveTourRequest;
import com.tripbuilder.dto.request.tour.TourStepRequest;
import com.tripbuilder.entity.booking.BookingStatus;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.exception.BadRequestException;
import com.tripbuilder.exception.UnauthorizedException;
import com.tripbuilder.repository.UserRepository;
import com.tripbuilder.service.admin.AdminService;
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

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    private AppUser findUser(String email) {
        return userRepository.findByEmailIgnoreCase(email).orElseThrow();
    }

    @Value("${app.auth.secret:tripbuilder-local-dev-secret-2026-hmac-key}")
    private String authSecret;

    @Test
    void enforcesRoleSeparationAcrossEndpoints() throws Exception {
        var customerAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, false));
        var guideAuth = authService.login(new LoginRequest("binh.guide@tripbuilder.vn", "123456", Role.GUIDE, false));

        // Cross-portal login is rejected with 401 and generic message (no portal/port leak)
        var ex1 = assertThrows(UnauthorizedException.class, () ->
                authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.GUIDE, false)));
        assertEquals("Email hoặc mật khẩu không chính xác", ex1.getMessage());
        var ex2 = assertThrows(UnauthorizedException.class, () ->
                authService.login(new LoginRequest("binh.guide@tripbuilder.vn", "123456", Role.CUSTOMER, false)));
        assertEquals("Email hoặc mật khẩu không chính xác", ex2.getMessage());

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
        var customer = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, false)).user();
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
        bookingService.accept(created.id());
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
        var customer = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, false)).user();
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
        var customer = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, false)).user();
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
                tour.id(), customer.id(), LocalDate.now().plusDays(25),
                tour.days(), 2, "COMPANION", null, false, null
        ));
        bookingService.accept(presetBooking.id());
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
        var customer = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, false)).user();
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
        var hoa = authService.login(new LoginRequest("hoa.do@gmail.com", "123456", Role.CUSTOMER, false)).user();
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
        var customerAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, false));
        var guideAuth = authService.login(new LoginRequest("binh.guide@tripbuilder.vn", "123456", Role.GUIDE, false));

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
                .andExpect(jsonPath("$.data.length()").value(12))
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

        // Global photos endpoint includes 66 + 35 region + 6 shared activities = 107
        mockMvc.perform(get("/api/regions/photos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(107));

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
        var guide = authService.login(new LoginRequest("binh.guide@tripbuilder.vn", "123456", Role.GUIDE, false)).user();
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
                        .content("{\"fullName\":\"Khách Mới\",\"email\":\"new.customer@gmail.com\",\"phone\":\"0909888777\",\"password\":\"StrongPass99\",\"confirmPassword\":\"StrongPass99\",\"acceptedTerms\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").exists())
                .andExpect(jsonPath("$.data.refreshToken").exists())
                .andExpect(jsonPath("$.data.expiresInSeconds").value(1800))
                .andExpect(jsonPath("$.data.user.role").value("CUSTOMER"))
                .andExpect(jsonPath("$.data.user.email").value("new.customer@gmail.com"));

        // Duplicate email -> 400
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Khách Trùng\",\"email\":\"new.customer@gmail.com\",\"phone\":\"0909888777\",\"password\":\"StrongPass99\",\"confirmPassword\":\"StrongPass99\",\"acceptedTerms\":true}"))
                .andExpect(status().isBadRequest());

        // 2. Admin login & cross-portal protection
        var adminAuth = authService.login(new LoginRequest("admin@tripbuilder.vn", "123456", Role.ADMIN, false));
        assertEquals(Role.ADMIN, adminAuth.user().role());
        assertThrows(UnauthorizedException.class, () ->
                authService.login(new LoginRequest("admin@tripbuilder.vn", "123456", Role.CUSTOMER, false)));
        assertThrows(UnauthorizedException.class, () ->
                authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.ADMIN, false)));

        // 3. /api/admin/overview authorization & payload
        mockMvc.perform(get("/api/admin/overview"))
                .andExpect(status().isUnauthorized());

        var customerAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, false));
        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + customerAuth.token()))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + adminAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalRegions").value(12))
                .andExpect(jsonPath("$.data.totalTours").exists())
                .andExpect(jsonPath("$.data.totalBookings").exists())
                .andExpect(jsonPath("$.data.totalPresetOptions").exists());
    }

    @Test
    void qaBreakerHardeningTestsPassWithout500OrSecurityLeaks() throws Exception {
        var customerAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, false));
        var guideAuth = authService.login(new LoginRequest("binh.guide@tripbuilder.vn", "123456", Role.GUIDE, false));
        var adminAuth = authService.login(new LoginRequest("admin@tripbuilder.vn", "123456", Role.ADMIN, false));

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
                        .content("{\"fullName\":\"Real Privacy User\",\"email\":\"real.privacy@gmail.com\",\"phone\":\"0912345678\",\"password\":\"StrongPass99\",\"confirmPassword\":\"StrongPass99\",\"acceptedTerms\":true}"))
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

    @Test
    void enforcesGuideTerritoryOnTourCreateAndUpdate() throws Exception {
        var binh = findUser("binh.guide@tripbuilder.vn");
        var adminAuth = authService.login(new LoginRequest("admin@tripbuilder.vn", "123456", Role.ADMIN, false));
        var validSteps = List.of(new TourStepRequest(1, "Trải nghiệm", "Tham quan", 300_000L, null));

        // Bình belongs to Hạ Long (region 1); passing regionId=2 is ignored and tour stays in Hạ Long (region 1)
        var forcedRegionTour = tourService.create(new SaveTourRequest(
                binh.getId(), 2L, "Tour tự động khoá vùng", "Mô tả", null, null, 2, validSteps
        ));
        assertEquals(1L, forcedRegionTour.regionId());

        // Every seeded/created tour must belong to the exact same region as its guide
        var allTours = tourService.list(null);
        assertFalse(allTours.isEmpty());
        for (var t : allTours) {
            assertNotNull(t.guide().regionId(), "Guide must always have a region");
            assertEquals(t.guide().regionId(), t.regionId(), "Tour " + t.title() + " guide region mismatch");
        }

        // Updating a tour with another regionId also preserves guide's region (region 1)
        var updatedForced = tourService.update(
                forcedRegionTour.id(),
                new SaveTourRequest(binh.getId(), 2L, "Đổi vùng bị bỏ qua", "Mô tả", null, null, 2, validSteps),
                binh
        );
        assertEquals(1L, updatedForced.regionId());

        // Admin cannot create a GUIDE without regionId -> 400
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"No Region Guide\",\"email\":\"noregion.guide@tripbuilder.vn\",\"password\":\"123456\",\"role\":\"GUIDE\"}"))
                .andExpect(status().isBadRequest());

        // Admin cannot change region of a GUIDE who already owns tours -> 400
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/admin/users/" + binh.getId())
                        .header("Authorization", "Bearer " + adminAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fullName\":\"Trần Văn Bình\",\"regionId\":2}"))
                .andExpect(status().isBadRequest());

        // Clean up temporary test tour so gallery invariants remain satisfied for subsequent tests
        tourService.delete(forcedRegionTour.id(), binh);
    }

    @Test
    void enforcesTourActiveLifecycleAndIncludeInactiveVisibility() throws Exception {
        var binhAuth = authService.login(new LoginRequest("binh.guide@tripbuilder.vn", "123456", Role.GUIDE, false));
        var adminAuth = authService.login(new LoginRequest("admin@tripbuilder.vn", "123456", Role.ADMIN, false));
        var validSteps = List.of(new TourStepRequest(1, "Trải nghiệm", "Chèo Kayak", 300_000L, null));

        var created = tourService.create(new SaveTourRequest(
                binhAuth.user().id(), 1L, "Tour Lifecycle Test", "Mô tả", null, null, 2, validSteps
        ));
        assertTrue(created.active());

        // Pause tour via PATCH /api/tours/{id}/status
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/api/tours/" + created.id() + "/status")
                        .header("Authorization", "Bearer " + binhAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(false));

        // Public GET /api/tours hides paused tour
        var publicList = tourService.list(null);
        assertTrue(publicList.stream().noneMatch(t -> t.id().equals(created.id())));

        // Guide with includeInactive=true sees their paused tour
        mockMvc.perform(get("/api/tours")
                        .param("guideId", String.valueOf(binhAuth.user().id()))
                        .param("includeInactive", "true")
                        .header("Authorization", "Bearer " + binhAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id==" + created.id() + ")].active").value(false));

        // Admin sees paused tour in /api/admin/tours
        mockMvc.perform(get("/api/admin/tours")
                        .header("Authorization", "Bearer " + adminAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id==" + created.id() + ")].active").value(false));

        // Resume tour
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .patch("/api/tours/" + created.id() + "/status")
                        .header("Authorization", "Bearer " + adminAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"active\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.active").value(true));
    }

    @Test
    void enforcesGuideAcceptBeforeConfirmAndPreventsCompanionOverbooking() throws Exception {
        var customerAuth = authService.login(new LoginRequest("khoa.hoang@gmail.com", "123456", Role.CUSTOMER, false));
        var guideAuth = authService.login(new LoginRequest("thao.guide@tripbuilder.vn", "123456", Role.GUIDE, false));
        var customerUser = findUser("khoa.hoang@gmail.com");
        var guideUser = findUser("thao.guide@tripbuilder.vn");
        var hueTour = tourService.list(guideAuth.user().id()).get(0);

        LocalDate start = LocalDate.now().plusDays(40);
        var b1 = bookingService.create(new CreateBookingRequest(
                hueTour.id(), customerUser.getId(), start, hueTour.days(), 2,
                "COMPANION", "Đơn 1", false, null
        ));
        assertFalse(b1.guideAccepted());

        // Cannot confirm before guide accepts
        assertThrows(BadRequestException.class, () -> bookingService.confirm(b1.id(), customerUser));

        // Guide accepts via POST /api/bookings/{id}/accept
        mockMvc.perform(post("/api/bookings/" + b1.id() + "/accept")
                        .header("Authorization", "Bearer " + guideAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.guideAccepted").value(true));

        var confirmed = bookingService.confirm(b1.id(), customerUser);
        assertEquals(BookingStatus.CONFIRMED, confirmed.status());
        assertTrue(confirmed.depositPaid());
        assertEquals(30, confirmed.depositPercent());
        assertEquals(Math.round(confirmed.totalPrice() * 0.3), confirmed.depositAmount());
        assertTrue(confirmed.hasConfirmedSnapshot());

        // Second overlapping COMPANION booking for the same guide must be blocked on accept/confirm
        var b2 = bookingService.create(new CreateBookingRequest(
                hueTour.id(), customerUser.getId(), start.plusDays(1), hueTour.days(), 2,
                "COMPANION", "Đơn trùng lịch", false, null
        ));
        assertThrows(BadRequestException.class, () -> bookingService.accept(b2.id(), guideUser));

        // REMOTE booking on overlapping dates is allowed (use different guest count to avoid 5s dedup of b2)
        var bRemote = bookingService.create(new CreateBookingRequest(
                hueTour.id(), customerUser.getId(), start.plusDays(1), hueTour.days(), 3,
                "REMOTE", "Đơn hỗ trợ từ xa", false, null
        ));
        var acceptedRemote = bookingService.accept(bRemote.id(), guideUser);
        assertTrue(acceptedRemote.guideAccepted());
    }

    @Test
    void blocksRequoteOnConfirmedAndSupportsRejectChangeRollback() throws Exception {
        var customerAuth = authService.login(new LoginRequest("hoa.do@gmail.com", "123456", Role.CUSTOMER, false));
        var guideAuth = authService.login(new LoginRequest("minh.guide@tripbuilder.vn", "123456", Role.GUIDE, false));
        var customerUser = findUser("hoa.do@gmail.com");
        var guideUser = findUser("minh.guide@tripbuilder.vn");
        var sapaTour = tourService.list(guideAuth.user().id()).get(0);

        var created = bookingService.create(new CreateBookingRequest(
                sapaTour.id(), customerUser.getId(), LocalDate.now().plusDays(50),
                sapaTour.days(), 2, "COMPANION", "Đặt Sa Pa", false, null
        ));
        bookingService.accept(created.id(), guideUser);
        var confirmed = bookingService.confirm(created.id(), customerUser);
        long originalTotal = confirmed.totalPrice();

        // Guide cannot requote directly while status is CONFIRMED
        assertThrows(BadRequestException.class, () -> bookingService.requote(confirmed.id(), new RequoteRequest(
                confirmed.days(), confirmed.guests(), 0L, "Tự ý báo giá",
                confirmed.steps().stream()
                        .map(s -> new BookingStepRequest(s.dayNumber(), s.category(), s.title(), s.pricePerPerson(),
                                s.originalTitle(), s.originalPricePerPerson(), s.noteType(), s.imageUrl()))
                        .toList()
        ), guideUser));

        // Customer requests change after confirm -> CHANGE_REQUESTED
        var changed = bookingService.customize(confirmed.id(), new CustomizeRequest(
                confirmed.startDate(), confirmed.days(), 4, "COMPANION", "Thêm 2 khách",
                confirmed.steps().stream()
                        .map(s -> new BookingStepRequest(s.dayNumber(), s.category(), s.title(), s.pricePerPerson(),
                                s.originalTitle(), s.originalPricePerPerson(), s.noteType(), s.imageUrl()))
                        .toList()
        ), customerUser);
        assertEquals(BookingStatus.CHANGE_REQUESTED, changed.status());
        assertEquals(4, changed.guests());

        // Guide rejects change -> rolls back to CONFIRMED snapshot
        mockMvc.perform(post("/api/bookings/" + confirmed.id() + "/reject-change")
                        .header("Authorization", "Bearer " + guideAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.data.guests").value(2))
                .andExpect(jsonPath("$.data.totalPrice").value(originalTotal))
                .andExpect(jsonPath("$.data.postConfirmAdjustment").value(false));
    }

    @Test
    void enforcesCompletedStatusForReviewAndAggregatesPublicTourReviews() throws Exception {
        var customerAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, false));
        var guideAuth = authService.login(new LoginRequest("minh.guide@tripbuilder.vn", "123456", Role.GUIDE, false));
        var customerUser = findUser("an.nguyen@gmail.com");
        var guideUser = findUser("minh.guide@tripbuilder.vn");
        var sapaTour = tourService.list(guideAuth.user().id()).get(0);

        var created = bookingService.create(new CreateBookingRequest(
                sapaTour.id(), customerUser.getId(), LocalDate.now().plusDays(60),
                sapaTour.days(), 2, "REMOTE", "Chuyến Sa Pa", false, null
        ));
        bookingService.accept(created.id(), guideUser);
        bookingService.confirm(created.id(), customerUser);

        // Review before COMPLETED is rejected
        mockMvc.perform(post("/api/bookings/" + created.id() + "/review")
                        .header("Authorization", "Bearer " + customerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5,\"review\":\"Chưa hoàn thành\"}"))
                .andExpect(status().isBadRequest());

        // Guide completes booking -> COMPLETED
        mockMvc.perform(post("/api/bookings/" + created.id() + "/complete")
                        .header("Authorization", "Bearer " + guideAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"));

        // Review now succeeds and appears on TourDto
        mockMvc.perform(post("/api/bookings/" + created.id() + "/review")
                        .header("Authorization", "Bearer " + customerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":4,\"review\":\"Rất hài lòng!\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.customerRating").value(4));

        var refreshedTour = tourService.get(sapaTour.id());
        assertEquals(1, refreshedTour.reviewCount());
        assertEquals(4.0, refreshedTour.averageRating());
        assertEquals(1, refreshedTour.reviews().size());
    }

    @Test
    void supportsAdultsChildrenLeadTimeCancelReasonAndGroupAdjReset() throws Exception {
        var customerAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, false));
        var tour = tourService.list(null).get(0);

        // Same-day or past startDate rejected (24h lead time)
        assertThrows(BadRequestException.class, () -> bookingService.create(new CreateBookingRequest(
                tour.id(), customerAuth.user().id(), LocalDate.now(),
                tour.days(), 2, "COMPANION", null, false, null
        )));

        // Adults + children breakdown
        var created = bookingService.create(new CreateBookingRequest(
                tour.id(), customerAuth.user().id(), LocalDate.now().plusDays(70),
                tour.days(), 3, 2, 1, "REMOTE", "2 người lớn 1 trẻ em", false, null
        ));
        assertEquals(3, created.guests());
        assertEquals(2, created.adults());
        assertEquals(1, created.children());

        // Guide requotes with groupAdjustment, then customer modifies -> groupAdjustment resets to 0
        var requoted = bookingService.requote(created.id(), new RequoteRequest(
                created.days(), created.guests(), -200_000L, "Giảm đoàn",
                created.steps().stream()
                        .map(s -> new BookingStepRequest(s.dayNumber(), s.category(), s.title(), s.pricePerPerson(),
                                s.originalTitle(), s.originalPricePerPerson(), s.noteType(), s.imageUrl()))
                        .toList()
        ));
        assertEquals(-200_000L, requoted.groupAdjustment());

        var customized = bookingService.customize(created.id(), new CustomizeRequest(
                created.startDate(), created.days(), 4, 3, 1, "REMOTE", "Đổi lên 4 khách",
                requoted.steps().stream()
                        .map(s -> new BookingStepRequest(s.dayNumber(), s.category(), s.title(), s.pricePerPerson(),
                                s.originalTitle(), s.originalPricePerPerson(), s.noteType(), s.imageUrl()))
                        .toList()
        ), findUser("an.nguyen@gmail.com"));
        assertEquals(0L, customized.groupAdjustment());
        assertEquals(4, customized.guests());
        assertEquals(3, customized.adults());
        assertEquals(1, customized.children());

        // Cancel with reason
        mockMvc.perform(post("/api/bookings/" + created.id() + "/cancel")
                        .header("Authorization", "Bearer " + customerAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"Đổi kế hoạch cá nhân\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("CANCELLED"))
                .andExpect(jsonPath("$.data.cancelReason").value("Đổi kế hoạch cá nhân"));
    }

    @Test
    void emitsAndManagesInAppNotifications() throws Exception {
        var customerAuth = authService.login(new LoginRequest("khoa.hoang@gmail.com", "123456", Role.CUSTOMER, false));
        var guideAuth = authService.login(new LoginRequest("dung.guide@tripbuilder.vn", "123456", Role.GUIDE, false));
        var hoiAnTour = tourService.list(guideAuth.user().id()).get(0);

        var created = bookingService.create(new CreateBookingRequest(
                hoiAnTour.id(), customerAuth.user().id(), LocalDate.now().plusDays(80),
                hoiAnTour.days(), 2, "REMOTE", "Test thông báo", false, null
        ));
        bookingService.accept(created.id(), findUser("dung.guide@tripbuilder.vn"));

        // Customer should have unread BOOKING_ACCEPTED notification
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)))
                .andExpect(jsonPath("$.data.items[0].relatedBookingId").value(created.id()));

        // Mark all as read
        mockMvc.perform(post("/api/notifications/read-all")
                        .header("Authorization", "Bearer " + customerAuth.token()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", "Bearer " + customerAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(0));
    }

    @Test
    void supportsAdminReassignGuideAndOverviewDepositMetrics() throws Exception {
        var adminAuth = authService.login(new LoginRequest("admin@tripbuilder.vn", "123456", Role.ADMIN, false));
        var customerAuth = authService.login(new LoginRequest("an.nguyen@gmail.com", "123456", Role.CUSTOMER, false));
        var guideBinh = authService.login(new LoginRequest("binh.guide@tripbuilder.vn", "123456", Role.GUIDE, false)).user();
        var guideMinh = authService.login(new LoginRequest("minh.guide@tripbuilder.vn", "123456", Role.GUIDE, false)).user();
        var haLongTour = tourService.list(guideBinh.id()).get(0);

        var created = bookingService.create(new CreateBookingRequest(
                haLongTour.id(), customerAuth.user().id(), LocalDate.now().plusDays(90),
                haLongTour.days(), 2, "REMOTE", "Test điều phối", false, null
        ));

        // Cross-region reassign (Hạ Long -> Sa Pa) must fail -> 400
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/admin/bookings/" + created.id() + "/reassign")
                        .header("Authorization", "Bearer " + adminAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"guideId\":" + guideMinh.id() + "}"))
                .andExpect(status().isBadRequest());

        // Same-region reassign (create second Hạ Long guide) succeeds -> 200
        String uniqueHaLongEmail = "halong.backup." + System.nanoTime() + "@tripbuilder.vn";
        Long sameRegionGuideId = adminService.createUser(new CreateUserRequest(
                "Backup Hạ Long", uniqueHaLongEmail, "BackupPass123", "0909111222",
                Role.GUIDE, 1L, "Guide Hạ Long", 4, null
        )).id();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .put("/api/admin/bookings/" + created.id() + "/reassign")
                        .header("Authorization", "Bearer " + adminAuth.token())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"guideId\":" + sameRegionGuideId + "}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.guide.id").value(sameRegionGuideId));

        mockMvc.perform(get("/api/admin/overview")
                        .header("Authorization", "Bearer " + adminAuth.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.collectedDeposit").value(org.hamcrest.Matchers.greaterThan(0)))
                .andExpect(jsonPath("$.data.completedBookings").value(org.hamcrest.Matchers.greaterThanOrEqualTo(1)));
    }
}
