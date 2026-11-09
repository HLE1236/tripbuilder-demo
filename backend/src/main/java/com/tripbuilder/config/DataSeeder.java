package com.tripbuilder.config;

import com.tripbuilder.booking.BookingService;
import com.tripbuilder.booking.BookingService.CreateBookingRequest;
import com.tripbuilder.booking.BookingService.RequoteRequest;
import com.tripbuilder.catalog.PresetOption;
import com.tripbuilder.catalog.PresetOptionRepository;
import com.tripbuilder.region.Region;
import com.tripbuilder.region.RegionRepository;
import com.tripbuilder.tour.TourService;
import com.tripbuilder.tour.TourService.SaveTourRequest;
import com.tripbuilder.tour.TourService.StepInput;
import com.tripbuilder.user.AppUser;
import com.tripbuilder.user.Role;
import com.tripbuilder.user.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Seed dữ liệu mẫu trực quan, số tiền tròn chẵn dễ nhẩm tính:
 * - 6 khu vực, 30+ gợi ý hoạt động/dịch vụ chọn nhanh
 * - 3 Tour Guide, 3 Khách hàng
 * - 6 Tour Preset có sẵn lịch trình & giá gốc/người
 * - 4 Booking mẫu đại diện cho đủ 4 bước trên thanh tiến trình (Stepper)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RegionRepository regionRepository;
    private final UserRepository userRepository;
    private final PresetOptionRepository optionRepository;
    private final TourService tourService;
    private final BookingService bookingService;

    @Override
    public void run(String... args) {
        seedRegions();
        if (userRepository.count() > 0) return;

        Map<String, Region> r = new HashMap<>();
        regionRepository.findAll().forEach(x -> r.put(x.getCode(), x));

        seedOptions(r);

        // ===== Tài khoản mẫu =====
        AppUser binh = user("Trần Văn Bình", Role.GUIDE, "binh.guide@tripbuilder.vn", "0912 345 678",
                "Hướng dẫn viên bản địa Quảng Ninh & Tây Bắc (8 năm kinh nghiệm).", 8, r.get("ha-long"));
        AppUser chi = user("Lê Thị Chi", Role.GUIDE, "chi.guide@tripbuilder.vn", "0987 654 321",
                "Người Đà Lạt gốc, chuyên thiết kế tour nghỉ dưỡng gia đình & săn mây.", 5, r.get("da-lat"));
        AppUser dung = user("Phạm Minh Dũng", Role.GUIDE, "dung.guide@tripbuilder.vn", "0905 111 222",
                "Thuyết minh viên di sản miền Trung Hội An – Huế.", 6, r.get("hoi-an"));

        AppUser an = user("Nguyễn Văn An", Role.CUSTOMER, "an.nguyen@gmail.com", "0901 234 567", null, null, null);
        AppUser hoa = user("Đỗ Thu Hoa", Role.CUSTOMER, "hoa.do@gmail.com", "0934 567 890", null, null, null);
        AppUser khoa = user("Hoàng Minh Khoa", Role.CUSTOMER, "khoa.hoang@gmail.com", "0978 222 333", null, null, null);

        // ===== 6 Tour Preset (mỗi mục có giá/người rõ ràng, cộng lại ra Giá gốc/người) =====
        Long tHaLong = tourService.create(new SaveTourRequest(
                binh.getId(), r.get("ha-long").getId(),
                "Hạ Long 2N1Đ — Khám phá Vịnh & Chèo Kayak",
                "Lịch trình chuẩn 2 ngày 1 đêm tại Hạ Long: xe Limousine đưa đón, khách sạn 4 sao hướng vịnh, chèo Kayak hang Luồn và thưởng thức hải sản.",
                null, 2,
                List.of(
                        new StepInput(1, "Di chuyển", "Xe Limousine đón Hà Nội – Hạ Long & Guide đồng hành", 400_000),
                        new StepInput(1, "Khách sạn", "Nhận phòng Khách sạn Mường Thanh 4★ (hướng vịnh)", 700_000),
                        new StepInput(1, "Trải nghiệm", "Tàu tham quan vịnh Hạ Long & Chèo Kayak hang Luồn", 500_000),
                        new StepInput(1, "Ăn uống", "Bữa tối Set hải sản Hạ Long tại nhà hàng ven biển", 400_000),
                        new StepInput(2, "Trải nghiệm", "Vui chơi Cáp treo Nữ Hoàng & Đồi Mặt Trời", 400_000),
                        new StepInput(2, "Di chuyển", "Ăn trưa đặc sản chả mực & Xe đưa về Hà Nội", 400_000)
                )
        )).id(); // Giá gốc = 2.800.000đ / người

        Long tSaPa = tourService.create(new SaveTourRequest(
                binh.getId(), r.get("sa-pa").getId(),
                "Sa Pa 3N2Đ — Bản Cát Cát & Đỉnh Fansipan",
                "Trải nghiệm văn hoá H'Mông tại bản Cát Cát, chinh phục đỉnh Fansipan và thưởng thức lẩu cá hồi suối lạnh.",
                null, 3,
                List.of(
                        new StepInput(1, "Di chuyển", "Xe giường nằm/Limousine Hà Nội – Sa Pa & Guide đón", 500_000),
                        new StepInput(1, "Khách sạn", "Nghỉ tại Homestay gỗ view thung lũng Mường Hoa (2 đêm)", 800_000),
                        new StepInput(1, "Trải nghiệm", "Trekking bản Cát Cát & Thác Tiên Sa cùng Guide bản địa", 300_000),
                        new StepInput(2, "Trải nghiệm", "Vé Cáp treo khứ hồi chinh phục đỉnh Fansipan", 900_000),
                        new StepInput(2, "Ăn uống", "Tiệc tối Lẩu cá hồi & đồ nướng Sa Pa", 400_000),
                        new StepInput(3, "Di chuyển", "Dạo chợ phiên Sa Pa mua quà & Xe đưa về Hà Nội", 500_000)
                )
        )).id(); // Giá gốc = 3.400.000đ / người

        Long tDaLat = tourService.create(new SaveTourRequest(
                chi.getId(), r.get("da-lat").getId(),
                "Đà Lạt 3N2Đ — Săn mây Cầu Đất & Đồi thông",
                "Đón bình minh biển mây Cầu Đất, hái dâu tại vườn, thưởng thức lẩu gà lá é và cà phê acoustic giữa rừng thông.",
                null, 3,
                List.of(
                        new StepInput(1, "Di chuyển", "Xe riêng đón sân bay Liên Khương & Guide bản địa", 300_000),
                        new StepInput(1, "Khách sạn", "Homestay Đồi Thông ấm cúng (trọn gói 2 đêm)", 800_000),
                        new StepInput(1, "Ăn uống", "Ăn tối Lẩu gà lá é Tao Ngộ & dạo chợ đêm Đà Lạt", 250_000),
                        new StepInput(2, "Trải nghiệm", "Tour xe Jeep săn mây đồi chè Cầu Đất lúc 5h sáng", 450_000),
                        new StepInput(2, "Trải nghiệm", "Tham quan vườn dâu công nghệ cao & Thung lũng Tình Yêu", 300_000),
                        new StepInput(3, "Di chuyển", "Thưởng thức cà phê Mê Linh & Xe tiễn sân bay", 300_000)
                )
        )).id(); // Giá gốc = 2.400.000đ / người

        Long tPhuQuoc = tourService.create(new SaveTourRequest(
                chi.getId(), r.get("phu-quoc").getId(),
                "Phú Quốc 3N2Đ — Cano 4 Đảo & Lặn ngắm san hô",
                "Nghỉ dưỡng biển Bãi Trường, đi cano 4 đảo phía Nam, chụp ảnh SUP và ăn hải sản chợ đêm Dinh Cậu.",
                null, 3,
                List.of(
                        new StepInput(1, "Di chuyển", "Xe đón sân bay Phú Quốc & tham quan Làng chài Hàm Ninh", 300_000),
                        new StepInput(1, "Khách sạn", "Resort 4★ Sol by Meliá ven biển (trọn gói 2 đêm)", 1_800_000),
                        new StepInput(2, "Trải nghiệm", "Cano 4 đảo: Hòn Móng Tay, Hòn Gầm Ghì, lặn ngắm san hô", 800_000),
                        new StepInput(2, "Ăn uống", "Bữa tối Hải sản chợ đêm Phú Quốc (ghẹ, nhum, gỏi cá trích)", 500_000),
                        new StepInput(3, "Di chuyển", "Ngắm hoàng hôn Sunset Sanato & Xe tiễn sân bay", 300_000)
                )
        )).id(); // Giá gốc = 3.700.000đ / người

        Long tHoiAn = tourService.create(new SaveTourRequest(
                dung.getId(), r.get("hoi-an").getId(),
                "Hội An 2N1Đ — Đèn lồng Phố cổ & Rừng dừa Bảy Mẫu",
                "Trải nghiệm thả đèn hoa đăng sông Hoài, đi thuyền thúng rừng dừa Bảy Mẫu và học nấu món Quảng.",
                null, 2,
                List.of(
                        new StepInput(1, "Di chuyển", "Xe đón Đà Nẵng – Hội An & Guide thuyết minh phố cổ", 300_000),
                        new StepInput(1, "Khách sạn", "Hội An Riverside Villa ven sông Hoài (1 đêm)", 600_000),
                        new StepInput(1, "Trải nghiệm", "Dạo phố cổ, chùa Cầu & Đi thuyền thả đèn hoa đăng", 300_000),
                        new StepInput(1, "Ăn uống", "Thực đơn đặc sản Cao lầu, Cơm gà & Bánh mì Phượng", 250_000),
                        new StepInput(2, "Trải nghiệm", "Thuyền thúng Rừng dừa Bảy Mẫu & Lớp nấu ăn Trà Quế", 550_000)
                )
        )).id(); // Giá gốc = 2.000.000đ / người

        tourService.create(new SaveTourRequest(
                dung.getId(), r.get("hue").getId(),
                "Cố đô Huế 2N1Đ — Đại Nội, Lăng tẩm & Ca Huế sông Hương",
                "Tìm hiểu lịch sử triều Nguyễn cùng thuyết minh viên bản địa, nghe ca Huế trên thuyền rồng và thưởng thức cơm Vua.",
                null, 2,
                List.of(
                        new StepInput(1, "Khách sạn", "Khách sạn Saigon Morin 4★ bên cầu Trường Tiền", 700_000),
                        new StepInput(1, "Trải nghiệm", "Tham quan Đại Nội Hoàng Thành & Chùa Thiên Mụ", 350_000),
                        new StepInput(1, "Ăn uống", "Cơm cung đình Huế & Nghe ca Huế trên sông Hương", 450_000),
                        new StepInput(2, "Trải nghiệm", "Xe đưa đón tham quan Lăng Tự Đức & Lăng Khải Định", 400_000)
                )
        )); // Giá gốc = 1.900.000đ / người

        // ===== 4 Booking mẫu ở đúng 4 bước của Stepper =====
        LocalDate today = LocalDate.now();

        // 1. BK-0001 (Bước 2 - WAITING_REQUOTE): Khách Nguyễn Văn An đặt tour Hạ Long của Guide Bình,
        //    đã tự chỉnh sửa: đổi KS 4★ lên Du thuyền 5★ và tự gõ thêm yêu cầu "Tổ chức bánh kem sinh nhật trên tàu"
        bookingService.create(new CreateBookingRequest(
                tHaLong, an.getId(), today.plusDays(15), 2, 2,
                "Hai vợ chồng đi kỷ niệm ngày cưới, muốn đổi từ khách sạn đất liền sang ngủ đêm trên Du thuyền 5★ và đặt thêm bánh kem trên tàu.",
                true,
                List.of(
                        new BookingService.StepInput(1, "Di chuyển", "Xe Limousine đón Hà Nội – Hạ Long & Guide đồng hành", 400_000, "PRESET"),
                        new BookingService.StepInput(1, "Khách sạn", "Đổi sang: Du thuyền Paradise 5★ ngủ đêm trên vịnh", 1_800_000, "MODIFIED"),
                        new BookingService.StepInput(1, "Trải nghiệm", "Tàu tham quan vịnh Hạ Long & Chèo Kayak hang Luồn", 500_000, "PRESET"),
                        new BookingService.StepInput(1, "Ăn uống", "Bữa tối Set hải sản Hạ Long tại nhà hàng ven biển", 400_000, "PRESET"),
                        new BookingService.StepInput(1, "Yêu cầu thêm", "Chuẩn bị bánh kem & hoa tươi kỷ niệm ngày cưới tại cabin", 0, "CUSTOM"),
                        new BookingService.StepInput(2, "Di chuyển", "Ăn trưa đặc sản chả mực & Xe đưa về Hà Nội", 400_000, "PRESET")
                )
        ));

        // 2. BK-0002 (Bước 3 - REQUOTED): Khách Đỗ Thu Hoa đặt tour Đà Lạt (4 người), đã yêu cầu đổi sang Villa nguyên căn
        //    và Guide Lê Thị Chi ĐÃ BÁO GIÁ LẠI (chờ khách Hoa bấm "Đồng ý chốt")
        Long b2 = bookingService.create(new CreateBookingRequest(
                tDaLat, hoa.getId(), today.plusDays(20), 3, 4,
                "Nhóm mình 4 người muốn nâng cấp lên Villa Pháp cổ và thêm tiệc nướng BBQ buổi tối Ngày 2.",
                true,
                List.of(
                        new BookingService.StepInput(1, "Di chuyển", "Xe riêng đón sân bay Liên Khương & Guide bản địa", 300_000, "PRESET"),
                        new BookingService.StepInput(1, "Khách sạn", "Đổi sang: Biệt thự Ana Mandara Villas 5★ (2 đêm)", 1_500_000, "MODIFIED"),
                        new BookingService.StepInput(2, "Trải nghiệm", "Tour xe Jeep săn mây đồi chè Cầu Đất lúc 5h sáng", 450_000, "PRESET"),
                        new BookingService.StepInput(2, "Yêu cầu thêm", "Tiệc nướng BBQ sân vườn riêng buổi tối cho 4 người", 0, "CUSTOM"),
                        new BookingService.StepInput(3, "Di chuyển", "Thưởng thức cà phê Mê Linh & Xe tiễn sân bay", 300_000, "PRESET")
                )
        )).id();
        bookingService.requote(b2, new RequoteRequest(
                3, 4, -400_000,
                "Chi đã kiểm tra còn Villa 2 phòng ngủ cho nhóm 4 bạn. Tiệc BBQ sân vườn tính 350k/người. Giảm thêm 400k ưu đãi nhóm 4 khách nhé!",
                List.of(
                        new BookingService.StepInput(1, "Di chuyển", "Xe riêng đón sân bay Liên Khương & Guide bản địa", 300_000, "PRESET"),
                        new BookingService.StepInput(1, "Khách sạn", "Đổi sang: Biệt thự Ana Mandara Villas 5★ (2 đêm)", 1_500_000, "MODIFIED"),
                        new BookingService.StepInput(2, "Trải nghiệm", "Tour xe Jeep săn mây đồi chè Cầu Đất lúc 5h sáng", 450_000, "PRESET"),
                        new BookingService.StepInput(2, "Yêu cầu thêm", "Tiệc nướng BBQ sân vườn riêng buổi tối (đã báo giá)", 350_000, "GUIDE"),
                        new BookingService.StepInput(3, "Di chuyển", "Thưởng thức cà phê Mê Linh & Xe tiễn sân bay", 300_000, "PRESET")
                )
        ));

        // 3. BK-0003 (Bước 1 - BOOKED_ORIGINAL): Khách Hoàng Minh Khoa vừa đặt nguyên bản tour Hội An (có thể chốt ngay hoặc bấm Chỉnh sửa)
        bookingService.create(new CreateBookingRequest(
                tHoiAn, khoa.getId(), today.plusDays(25), 2, 2,
                "Gia đình đi theo đúng lịch trình chuẩn của Guide.",
                false, null
        ));

        // 4. BK-0004 (Bước 4 - CONFIRMED): Đơn đã hoàn tất cả 4 bước
        Long b4 = bookingService.create(new CreateBookingRequest(
                tPhuQuoc, an.getId(), today.plusDays(45), 3, 2,
                "Giữ nguyên lịch trình chuẩn Phú Quốc.",
                false, null
        )).id();
        bookingService.confirm(b4);

        log.info("Seeded clean demo dataset successfully");
    }

    private void seedOptions(Map<String, Region> r) {
        Region hl = r.get("ha-long"), dl = r.get("da-lat"), ha = r.get("hoi-an"),
                sp = r.get("sa-pa"), pq = r.get("phu-quoc"), hue = r.get("hue");

        opt(hl, "Khách sạn", "Khách sạn Mường Thanh 4★ hướng vịnh", 700_000);
        opt(hl, "Khách sạn", "Du thuyền Paradise 5★ ngủ đêm trên vịnh", 1_800_000);
        opt(hl, "Trải nghiệm", "Tàu tham quan vịnh & Chèo Kayak hang Luồn", 500_000);
        opt(hl, "Trải nghiệm", "Cáp treo Nữ Hoàng & Công viên Sun World", 400_000);
        opt(hl, "Ăn uống", "Bữa tối Set hải sản tươi sống Hạ Long", 400_000);
        opt(hl, "Di chuyển", "Xe Limousine đưa đón Hà Nội – Hạ Long", 400_000);

        opt(dl, "Khách sạn", "Homestay Đồi Thông view thung lũng (2 đêm)", 800_000);
        opt(dl, "Khách sạn", "Biệt thự Ana Mandara Villas 5★ (2 đêm)", 1_500_000);
        opt(dl, "Trải nghiệm", "Tour xe Jeep săn mây Cầu Đất 5h sáng", 450_000);
        opt(dl, "Trải nghiệm", "Tham quan vườn dâu & Thung lũng Tình Yêu", 300_000);
        opt(dl, "Ăn uống", "Tiệc nướng BBQ sân vườn buổi tối", 350_000);
        opt(dl, "Ăn uống", "Lẩu gà lá é & đặc sản chợ đêm Đà Lạt", 250_000);

        opt(ha, "Khách sạn", "Hội An Riverside Villa ven sông Hoài", 600_000);
        opt(ha, "Khách sạn", "Victoria Hội An Beach Resort 4★ ven biển", 1_400_000);
        opt(ha, "Trải nghiệm", "Thuyền thúng Rừng dừa Bảy Mẫu & Lớp nấu ăn", 550_000);
        opt(ha, "Trải nghiệm", "Vé tham quan phố cổ & Thả đèn hoa đăng", 300_000);
        opt(ha, "Trải nghiệm", "Show diễn thực cảnh Ký Ức Hội An", 600_000);

        opt(sp, "Khách sạn", "Homestay gỗ view thung lũng Mường Hoa (2 đêm)", 800_000);
        opt(sp, "Khách sạn", "Khách sạn 5★ Hotel de la Coupole (2 đêm)", 2_200_000);
        opt(sp, "Trải nghiệm", "Vé Cáp treo khứ hồi đỉnh Fansipan", 900_000);
        opt(sp, "Trải nghiệm", "Trekking bản Cát Cát – Lao Chải – Tả Van", 350_000);
        opt(sp, "Ăn uống", "Tiệc tối Lẩu cá hồi & đồ nướng Sa Pa", 400_000);

        opt(pq, "Khách sạn", "Resort 4★ Sol by Meliá ven biển (2 đêm)", 1_800_000);
        opt(pq, "Khách sạn", "Resort 5★ JW Marriott Bãi Khem (2 đêm)", 3_500_000);
        opt(pq, "Trải nghiệm", "Tour Cano 4 đảo & Lặn ngắm san hô", 800_000);
        opt(pq, "Trải nghiệm", "Vé Cáp treo Hòn Thơm vượt biển", 600_000);
        opt(pq, "Ăn uống", "Hải sản chợ đêm Dinh Cậu Phú Quốc", 500_000);

        opt(hue, "Khách sạn", "Khách sạn Saigon Morin 4★ bên sông Hương", 700_000);
        opt(hue, "Khách sạn", "Resort Làng Hành Hương (Pilgrimage Village) 5★", 1_500_000);
        opt(hue, "Trải nghiệm", "Tham quan Đại Nội & Lăng Tự Đức – Khải Định", 450_000);
        opt(hue, "Ăn uống", "Cơm cung đình Huế & Ca Huế trên sông Hương", 450_000);
    }

    private void opt(Region region, String cat, String title, long price) {
        optionRepository.save(PresetOption.builder()
                .region(region).category(cat).title(title).pricePerPerson(price).build());
    }

    private AppUser user(String name, Role role, String email, String phone, String bio, Integer years, Region region) {
        return userRepository.save(AppUser.builder()
                .fullName(name).role(role).email(email).phone(phone)
                .bio(bio).yearsExperience(years).region(region).build());
    }

    private void seedRegions() {
        if (regionRepository.count() > 0) return;
        regionRepository.saveAll(List.of(
                region("ha-long", "Vịnh Hạ Long", "Quảng Ninh", "Biển đảo", 4.9, 1,
                        "Di sản thiên nhiên thế giới với hàng nghìn đảo đá vôi, du thuyền và hải sản tươi ngon.",
                        "https://images.unsplash.com/photo-1528127269322-539801943592?w=900&q=80"),
                region("da-lat", "Đà Lạt", "Lâm Đồng", "Núi rừng", 4.8, 2,
                        "Thành phố ngàn hoa, khí hậu mát mẻ, đồi thông và những homestay xinh xắn.",
                        "https://images.unsplash.com/photo-1600255821058-c4f89958d700?w=900&q=80"),
                region("hoi-an", "Phố cổ Hội An", "Quảng Nam", "Văn hoá", 4.9, 3,
                        "Phố cổ đèn lồng, ẩm thực đường phố và làng nghề truyền thống.",
                        "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=900&q=80"),
                region("sa-pa", "Sa Pa", "Lào Cai", "Trekking", 4.7, 4,
                        "Ruộng bậc thang, đỉnh Fansipan và bản làng dân tộc vùng cao.",
                        "https://images.unsplash.com/photo-1570366583862-f91883984fde?w=900&q=80"),
                region("phu-quoc", "Phú Quốc", "Kiên Giang", "Nghỉ dưỡng", 4.8, 5,
                        "Đảo ngọc với bãi cát trắng, hoàng hôn rực rỡ và chợ đêm sôi động.",
                        "https://images.unsplash.com/photo-1589394815804-964ed0be2eb5?w=900&q=80"),
                region("hue", "Cố đô Huế", "Thừa Thiên Huế", "Lịch sử", 4.7, 6,
                        "Kinh thành, lăng tẩm triều Nguyễn, sông Hương và ẩm thực cung đình.",
                        "https://images.unsplash.com/photo-1558431382-27e303142255?w=900&q=80")
        ));
    }

    private Region region(String code, String name, String province, String tag, double rating, int order,
                          String desc, String img) {
        return Region.builder().code(code).name(name).province(province).tag(tag).rating(rating)
                .sortOrder(order).description(desc).imageUrl(img).build();
    }
}
