package com.tripbuilder.config;

import com.tripbuilder.dto.request.booking.BookingStepRequest;
import com.tripbuilder.dto.request.booking.CreateBookingRequest;
import com.tripbuilder.dto.request.booking.RequoteRequest;
import com.tripbuilder.dto.request.booking.ReviewRequest;
import com.tripbuilder.dto.request.tour.SaveTourRequest;
import com.tripbuilder.dto.request.tour.TourStepRequest;
import com.tripbuilder.service.auth.AuthService;
import com.tripbuilder.entity.booking.Booking;
import com.tripbuilder.repository.BookingRepository;
import com.tripbuilder.service.booking.BookingService;
import com.tripbuilder.entity.booking.BookingStep;
import com.tripbuilder.entity.catalog.PresetOption;
import com.tripbuilder.repository.PresetOptionRepository;
import com.tripbuilder.entity.favorite.SavedTour;
import com.tripbuilder.repository.SavedTourRepository;
import com.tripbuilder.entity.region.Region;
import com.tripbuilder.entity.region.RegionPhoto;
import com.tripbuilder.repository.RegionPhotoRepository;
import com.tripbuilder.repository.RegionRepository;
import com.tripbuilder.entity.tour.Tour;
import com.tripbuilder.repository.TourRepository;
import com.tripbuilder.service.tour.TourService;
import com.tripbuilder.entity.tour.TourStep;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final RegionRepository regionRepository;
    private final RegionPhotoRepository regionPhotoRepository;
    private final UserRepository userRepository;
    private final PresetOptionRepository optionRepository;
    private final TourRepository tourRepository;
    private final BookingRepository bookingRepository;
    private final SavedTourRepository savedTourRepository;
    private final TourService tourService;
    private final BookingService bookingService;
    private final JdbcTemplate jdbcTemplate;
    private final TransactionTemplate transactionTemplate;

    private record PhotoSeed(
            String regionCode,
            String url,
            String landmarkName,
            String caption,
            String category,
            String credit,
            int sortOrder
    ) {}

    // Ảnh dùng chung trong /images/activities/
    private static final String IMG_LIMO = "/images/activities/01-limousine-van.jpg";
    private static final String IMG_BBQ = "/images/activities/02-bbq-party.jpg";
    private static final String IMG_SEAFOOD = "/images/activities/03-seafood-feast.jpg";
    private static final String IMG_VIET_FOOD = "/images/activities/04-vietnamese-cuisine.jpg";
    private static final String IMG_RESORT_SPA = "/images/activities/05-resort-spa.jpg";
    private static final String IMG_COFFEE = "/images/activities/06-vietnamese-coffee-breakfast.jpg";

    // Avatar cục bộ trong /images/avatars/
    private static final String AVATAR_BINH = "/images/avatars/01-guide-minh.jpg";
    private static final String AVATAR_CHI = "/images/avatars/02-guide-lan.jpg";
    private static final String AVATAR_DUNG = "/images/avatars/03-guide-tuan.jpg";
    private static final String AVATAR_HOA = "/images/avatars/04-traveler-linh.jpg";
    private static final String AVATAR_AN = "/images/avatars/05-traveler-hung.jpg";
    private static final String AVATAR_KHOA = "/images/avatars/06-traveler-mai.jpg";

    // Ảnh bìa & địa danh từng vùng (khớp 100% manifest.json)
    private static final Map<String, List<String>> REGION_GALLERIES = Map.of(
            "ha-long", List.of(
                    "/images/tours/ha-long/01-bay-panorama.jpg",
                    "/images/tours/ha-long/02-titop-island.jpg",
                    "/images/tours/ha-long/03-trong-mai-islet.jpg",
                    "/images/tours/ha-long/04-cruise-bay.jpg",
                    "/images/tours/ha-long/05-kayak-luon-cave.jpg",
                    "/images/tours/ha-long/06-sung-sot-cave.jpg",
                    "/images/tours/ha-long/07-cua-van-village.jpg",
                    "/images/tours/ha-long/08-bai-chay-cable-car.jpg",
                    "/images/tours/ha-long/09-bay-view-hotel.jpg",
                    "/images/tours/ha-long/10-ha-long-seafood.jpg"
            ),
            "da-lat", List.of(
                    "/images/tours/da-lat/01-cau-dat-tea-hill.jpg",
                    "/images/tours/da-lat/02-tuyen-lam-lake.jpg",
                    "/images/tours/da-lat/03-xuan-huong-lake.jpg",
                    "/images/tours/da-lat/04-datanla-waterfall.jpg",
                    "/images/tours/da-lat/05-dalat-railway-station.jpg",
                    "/images/tours/da-lat/06-valley-of-love.jpg",
                    "/images/tours/da-lat/07-dalat-night-market.jpg",
                    "/images/tours/da-lat/08-french-villa-dalat.jpg",
                    "/images/tours/da-lat/09-pine-hill-homestay.jpg",
                    "/images/tours/da-lat/10-dalat-coffee.jpg"
            ),
            "hoi-an", List.of(
                    "/images/tours/hoi-an/01-ancient-town-lanterns.jpg",
                    "/images/tours/hoi-an/02-japanese-covered-bridge.jpg",
                    "/images/tours/hoi-an/03-lantern-street-night.jpg",
                    "/images/tours/hoi-an/04-yellow-walls-old-town.jpg",
                    "/images/tours/hoi-an/05-bay-mau-basket-boat.jpg",
                    "/images/tours/hoi-an/06-thu-bon-river-sunset.jpg",
                    "/images/tours/hoi-an/07-fujian-assembly-hall.jpg",
                    "/images/tours/hoi-an/08-an-bang-beach.jpg",
                    "/images/tours/hoi-an/09-riverside-villa.jpg",
                    "/images/tours/hoi-an/10-cao-lau-hoi-an.jpg"
            ),
            "sa-pa", List.of(
                    "/images/tours/sa-pa/01-muong-hoa-terraces.jpg",
                    "/images/tours/sa-pa/02-fansipan-summit.jpg",
                    "/images/tours/sa-pa/03-fansipan-cable-car.jpg",
                    "/images/tours/sa-pa/04-cat-cat-village.jpg",
                    "/images/tours/sa-pa/05-silver-waterfall.jpg",
                    "/images/tours/sa-pa/06-sapa-stone-church.jpg",
                    "/images/tours/sa-pa/07-sapa-market.jpg",
                    "/images/tours/sa-pa/08-muong-hoa-homestay.jpg",
                    "/images/tours/sa-pa/09-sapa-town-hotel.jpg",
                    "/images/tours/sa-pa/11-sapa-hotpot-bbq.jpg"
            ),
            "phu-quoc", List.of(
                    "/images/tours/phu-quoc/01-sao-beach.jpg",
                    "/images/tours/phu-quoc/02-hon-thom-cable-car.jpg",
                    "/images/tours/phu-quoc/03-an-thoi-archipelago.jpg",
                    "/images/tours/phu-quoc/04-coral-snorkeling.jpg",
                    "/images/tours/phu-quoc/05-dinh-cau-sunset.jpg",
                    "/images/tours/phu-quoc/06-ham-ninh-pier.jpg",
                    "/images/tours/phu-quoc/07-phu-quoc-resort.jpg",
                    "/images/tours/phu-quoc/08-night-market-seafood.jpg",
                    "/images/tours/phu-quoc/09-bai-dai-ganh-dau.jpg",
                    "/images/tours/phu-quoc/11-west-coast-sunset.jpg"
            ),
            "hue", List.of(
                    "/images/tours/hue/01-ngo-mon-gate.jpg",
                    "/images/tours/hue/02-thai-hoa-palace.jpg",
                    "/images/tours/hue/03-thien-mu-pagoda.jpg",
                    "/images/tours/hue/04-khai-dinh-tomb.jpg",
                    "/images/tours/hue/05-tu-duc-tomb.jpg",
                    "/images/tours/hue/06-perfume-river-dragon-boat.jpg",
                    "/images/tours/hue/07-truong-tien-bridge.jpg",
                    "/images/tours/hue/08-lap-an-lagoon.jpg",
                    "/images/tours/hue/09-hue-heritage-hotel.jpg",
                    "/images/tours/hue/10-bun-bo-hue.jpg"
            )
    );

    private static final List<PhotoSeed> PHOTO_CATALOG = List.of(
            // Shared activities (region == null)
            new PhotoSeed(null, "/images/activities/01-limousine-van.jpg", "Xe Limousine / Xe du lịch", "Xe du lịch đời mới đưa đón tận nơi trên các cung đường Việt Nam", "Di chuyển", "EurovisionNim", 1),
            new PhotoSeed(null, "/images/activities/02-bbq-party.jpg", "Tiệc BBQ nướng", "Bữa tiệc nướng BBQ thơm lừng hấp dẫn", "Ẩm thực", "HSeqao MLSGA", 2),
            new PhotoSeed(null, "/images/activities/03-seafood-feast.jpg", "Hải sản tươi sống", "Thưởng thức hải sản tươi ngon đánh bắt trong ngày", "Ẩm thực", "Phương Huy (thảo luận)", 3),
            new PhotoSeed(null, "/images/activities/04-vietnamese-cuisine.jpg", "Ẩm thực Việt Nam", "Mâm cơm và các món ngon truyền thống Việt Nam", "Ẩm thực", "Guilhem Vellut from Paris, France", 4),
            new PhotoSeed(null, "/images/activities/05-resort-spa.jpg", "Khu nghỉ dưỡng & Spa", "Không gian hồ bơi và spa thư giãn tại khu nghỉ dưỡng Việt Nam", "Lưu trú", "Dennis G. Jarvis", 5),
            new PhotoSeed(null, "/images/activities/06-vietnamese-coffee-breakfast.jpg", "Cà phê & Bữa sáng Việt", "Bữa sáng nhẹ nhàng cùng ly cà phê Việt đậm đà hương vị", "Ẩm thực", "Amenoc", 6),

            // Đà Lạt (11)
            new PhotoSeed("da-lat", "/images/tours/da-lat/01-cau-dat-tea-hill.jpg", "Đồi chè Cầu Đất", "Những luống chè xanh mướt trải dài trên đồi cao Đà Lạt", "Toàn cảnh", "ℍmoong", 10),
            new PhotoSeed("da-lat", "/images/tours/da-lat/02-tuyen-lam-lake.jpg", "Hồ Tuyền Lâm", "Mặt hồ Tuyền Lâm tĩnh lặng soi bóng rừng thông Đà Lạt", "Toàn cảnh", "Thai Ho from Ho Chi MInh, Viet Nam", 11),
            new PhotoSeed("da-lat", "/images/tours/da-lat/03-xuan-huong-lake.jpg", "Hồ Xuân Hương", "Hồ Xuân Hương thơ mộng ngay giữa trái tim thành phố Đà Lạt", "Toàn cảnh", "P. Hughes", 12),
            new PhotoSeed("da-lat", "/images/tours/da-lat/04-datanla-waterfall.jpg", "Thác Datanla", "Thác Datanla tung bọt trắng xóa giữa rừng thông cao nguyên", "Trải nghiệm", "Damian Vo", 13),
            new PhotoSeed("da-lat", "/images/tours/da-lat/05-dalat-railway-station.jpg", "Ga Đà Lạt", "Nhà ga xe lửa cổ kính với kiến trúc Art Deco đặc trưng của Đà Lạt", "Toàn cảnh", "Lars Curfs (Grashoofd)", 14),
            new PhotoSeed("da-lat", "/images/tours/da-lat/06-valley-of-love.jpg", "Đồi hoa Đà Lạt", "Vườn hoa rực rỡ sắc màu đặc trưng xứ sở ngàn hoa Đà Lạt", "Trải nghiệm", "nerdcoregirl", 15),
            new PhotoSeed("da-lat", "/images/tours/da-lat/07-dalat-night-market.jpg", "Chợ đêm Đà Lạt", "Không khí nhộn nhịp về đêm tại khu vực chợ Đà Lạt", "Trải nghiệm", "Roy Kim", 16),
            new PhotoSeed("da-lat", "/images/tours/da-lat/08-french-villa-dalat.jpg", "Biệt thự Pháp cổ Đà Lạt", "Kiến trúc biệt thự Pháp cổ kính ẩn mình dưới tán thông Đà Lạt", "Lưu trú", "hiyori13", 17),
            new PhotoSeed("da-lat", "/images/tours/da-lat/09-pine-hill-homestay.jpg", "Homestay đồi thông Đà Lạt", "Không gian nghỉ dưỡng giữa rừng thông và đồi núi Đà Lạt", "Lưu trú", "Liftold at Vietnamese Wikipedia", 18),
            new PhotoSeed("da-lat", "/images/tours/da-lat/10-dalat-coffee.jpg", "Cà phê cao nguyên Đà Lạt", "Cà phê phin đậm đà vùng cao nguyên Lâm Đồng", "Ẩm thực", "Frank Fox", 19),
            new PhotoSeed("da-lat", "/images/tours/da-lat/11-dalat-bbq-hotpot.jpg", "Bánh tráng nướng & BBQ Đà Lạt", "Món nướng phố núi thơm lừng trong không khí se lạnh Đà Lạt", "Ẩm thực", "Blueconcorde", 20),

            // Hạ Long (11)
            new PhotoSeed("ha-long", "/images/tours/ha-long/01-bay-panorama.jpg", "Vịnh Hạ Long", "Toàn cảnh Vịnh Hạ Long với hàng nghìn đảo đá vôi kỳ vĩ", "Toàn cảnh", "Richard Mortel from Riyadh, Saudi Arabia", 30),
            new PhotoSeed("ha-long", "/images/tours/ha-long/02-titop-island.jpg", "Đảo Ti Tốp", "Bãi biển và góc nhìn toàn cảnh từ đỉnh Đảo Ti Tốp, Vịnh Hạ Long", "Toàn cảnh", "thalling55", 31),
            new PhotoSeed("ha-long", "/images/tours/ha-long/03-trong-mai-islet.jpg", "Hòn Trống Mái", "Biểu tượng Hòn Trống Mái (Hòn Gà Chọi) trên Vịnh Hạ Long", "Toàn cảnh", "Hungda", 32),
            new PhotoSeed("ha-long", "/images/tours/ha-long/04-cruise-bay.jpg", "Du thuyền Vịnh Hạ Long", "Du thuyền truyền thống trên làn nước xanh ngọc Vịnh Hạ Long", "Trải nghiệm", "lumoplank", 33),
            new PhotoSeed("ha-long", "/images/tours/ha-long/05-kayak-luon-cave.jpg", "Kayak Hang Luồn", "Chèo thuyền kayak khám phá Hang Luồn và vách đá vôi Hạ Long", "Trải nghiệm", "Mig Gilbert from Brighton", 34),
            new PhotoSeed("ha-long", "/images/tours/ha-long/06-sung-sot-cave.jpg", "Hang Sửng Sốt", "Kỳ quan nhũ đá lung linh bên trong Hang Sửng Sốt, Hạ Long", "Trải nghiệm", "Jakub Hałun", 35),
            new PhotoSeed("ha-long", "/images/tours/ha-long/07-cua-van-village.jpg", "Làng chài Cửa Vạn", "Làng chài nổi bình yên trên Vịnh Hạ Long", "Trải nghiệm", "David Stanley", 36),
            new PhotoSeed("ha-long", "/images/tours/ha-long/08-bai-chay-cable-car.jpg", "Cáp treo Nữ Hoàng & Bãi Cháy", "Cầu Bãi Cháy và khu vực cáp treo nhìn ra vịnh Hạ Long", "Di chuyển", "Martin Lewison from Forest Hills, NY, U.S.A.", 37),
            new PhotoSeed("ha-long", "/images/tours/ha-long/09-bay-view-hotel.jpg", "Khách sạn hướng vịnh Hạ Long", "Khách sạn và khu nghỉ dưỡng hiện đại hướng vịnh Hạ Long", "Lưu trú", "Buileducanh (thảo luận)", 38),
            new PhotoSeed("ha-long", "/images/tours/ha-long/10-ha-long-seafood.jpg", "Hải sản Hạ Long", "Hải sản tươi sống đặc trưng vùng biển Quảng Ninh", "Ẩm thực", "Daderot", 39),
            new PhotoSeed("ha-long", "/images/tours/ha-long/11-cha-muc-ha-long.jpg", "Chả mực Hạ Long", "Món chả mực giã tay vàng ruộm đặc sản Hạ Long", "Ẩm thực", "Hoangkid (Đặng Thái Hoàng)", 40),

            // Hội An (11)
            new PhotoSeed("hoi-an", "/images/tours/hoi-an/01-ancient-town-lanterns.jpg", "Phố cổ Hội An & Sông Hoài", "Phố cổ Hội An rực rỡ sắc đèn lồng bên dòng sông Hoài thơ mộng", "Toàn cảnh", "Dennis G. Jarvis", 50),
            new PhotoSeed("hoi-an", "/images/tours/hoi-an/02-japanese-covered-bridge.jpg", "Chùa Cầu Hội An", "Chùa Cầu (Lai Viễn Kiều) – biểu tượng kiến trúc hơn 400 năm tuổi", "Toàn cảnh", "katiebordner", 51),
            new PhotoSeed("hoi-an", "/images/tours/hoi-an/03-lantern-street-night.jpg", "Phố đèn lồng về đêm", "Con phố treo đầy đèn lồng lụa lung linh khi đêm xuống tại Hội An", "Trải nghiệm", "lumoplank", 52),
            new PhotoSeed("hoi-an", "/images/tours/hoi-an/04-yellow-walls-old-town.jpg", "Tường vàng phố cổ Hội An", "Những dãy nhà cổ mái ngói rêu phong và bức tường vàng đặc trưng", "Toàn cảnh", "lumoplank", 53),
            new PhotoSeed("hoi-an", "/images/tours/hoi-an/05-bay-mau-basket-boat.jpg", "Thuyền thúng Rừng dừa Bảy Mẫu", "Trải nghiệm chèo thuyền thúng truyền thống tại Rừng dừa Bảy Mẫu", "Trải nghiệm", "Chester Ho chesterho", 54),
            new PhotoSeed("hoi-an", "/images/tours/hoi-an/06-thu-bon-river-sunset.jpg", "Hoàng hôn sông Thu Bồn", "Ánh hoàng hôn nhuộm vàng mặt sông Thu Bồn và những con thuyền gỗ", "Toàn cảnh", "Omar David Sandoval Sida", 55),
            new PhotoSeed("hoi-an", "/images/tours/hoi-an/07-fujian-assembly-hall.jpg", "Hội quán Phúc Kiến", "Cổng tam quan và kiến trúc chạm khắc tinh xảo tại Hội quán Phúc Kiến", "Trải nghiệm", "Suicasmo", 56),
            new PhotoSeed("hoi-an", "/images/tours/hoi-an/08-an-bang-beach.jpg", "Biển An Bàng", "Bãi biển An Bàng cát trắng nắng vàng cách phố cổ chỉ vài phút đi xe", "Toàn cảnh", "Isabell Schulz", 57),
            new PhotoSeed("hoi-an", "/images/tours/hoi-an/09-riverside-villa.jpg", "Villa ven sông Hội An", "Không gian lưu trú kiến trúc cổ thanh bình tại Hội An", "Lưu trú", "Rudolph.A.Furtado", 58),
            new PhotoSeed("hoi-an", "/images/tours/hoi-an/10-cao-lau-hoi-an.jpg", "Cao lầu Hội An", "Tô cao lầu đậm đà với sợi mì dai, thịt xá xíu và rau sống Trà Quế", "Ẩm thực", "Christophe95", 59),
            new PhotoSeed("hoi-an", "/images/tours/hoi-an/11-banh-mi-hoi-an.jpg", "Bánh mì Hội An", "Ổ bánh mì giòn rụm đầy ắp nhân thịt và rau thơm trứ danh Hội An", "Ẩm thực", "Andy Li", 60),

            // Huế (11)
            new PhotoSeed("hue", "/images/tours/hue/01-ngo-mon-gate.jpg", "Ngọ Môn - Đại Nội Huế", "Cổng Ngọ Môn uy nghi dẫn vào Hoàng thành Huế", "Toàn cảnh", "Suicasmo", 70),
            new PhotoSeed("hue", "/images/tours/hue/02-thai-hoa-palace.jpg", "Điện Thái Hòa", "Kiến trúc cung điện sơn son thếp vàng trong Đại Nội Huế", "Toàn cảnh", "Gary Todd from Xinzheng, China", 71),
            new PhotoSeed("hue", "/images/tours/hue/03-thien-mu-pagoda.jpg", "Chùa Thiên Mụ", "Tháp Phước Duyên bảy tầng cổ kính bên bờ sông Hương", "Toàn cảnh", "CEphoto, Uwe Aranas", 72),
            new PhotoSeed("hue", "/images/tours/hue/04-khai-dinh-tomb.jpg", "Lăng Khải Định", "Kiến trúc giao thoa Đông - Tây độc đáo tại Lăng Khải Định", "Trải nghiệm", "dronepicr", 73),
            new PhotoSeed("hue", "/images/tours/hue/05-tu-duc-tomb.jpg", "Lăng Tự Đức", "Không gian sơn thủy hữu tình và hồ Lưu Khiêm tại Lăng Tự Đức", "Trải nghiệm", "CEphoto, Uwe Aranas", 74),
            new PhotoSeed("hue", "/images/tours/hue/06-perfume-river-dragon-boat.jpg", "Thuyền rồng Sông Hương", "Thuyền rồng du ngoạn và nghe Ca Huế trên dòng sông Hương thơ mộng", "Trải nghiệm", "P. Hughes", 75),
            new PhotoSeed("hue", "/images/tours/hue/07-truong-tien-bridge.jpg", "Cầu Trường Tiền", "Cây cầu thép sáu vài mười hai nhịp bắc qua sông Hương", "Toàn cảnh", "Hưng Hồ Bá", 76),
            new PhotoSeed("hue", "/images/tours/hue/08-lap-an-lagoon.jpg", "Đầm Lập An - Lăng Cô", "Khung cảnh vịnh Lăng Cô và đầm Lập An trong xanh tựa tranh thủy mặc", "Toàn cảnh", "Edgardo W. Olivera", 77),
            new PhotoSeed("hue", "/images/tours/hue/09-hue-heritage-hotel.jpg", "Khách sạn di sản Huế", "Kiến trúc lưu trú cổ điển mang hơi thở cố đô bên sông Hương", "Lưu trú", "David McKelvey from Brisbane, Australia", 78),
            new PhotoSeed("hue", "/images/tours/hue/10-bun-bo-hue.jpg", "Bún bò Huế", "Tô bún bò Huế đậm đà hương sả ớt đặc sản đất cố đô", "Ẩm thực", "pelican from Tokyo, Japan", 79),
            new PhotoSeed("hue", "/images/tours/hue/11-minh-mang-tomb.jpg", "Lăng Minh Mạng", "Kiến trúc đối xứng uy nghiêm giữa rừng thông tại Lăng Minh Mạng", "Trải nghiệm", "CEphoto, Uwe Aranas", 80),

            // Phú Quốc (11)
            new PhotoSeed("phu-quoc", "/images/tours/phu-quoc/01-sao-beach.jpg", "Bãi Sao Phú Quốc", "Bờ cát trắng mịn và hàng dừa nghiêng bên làn nước trong xanh ở Bãi Sao", "Toàn cảnh", "Vivu Vietnam", 90),
            new PhotoSeed("phu-quoc", "/images/tours/phu-quoc/02-hon-thom-cable-car.jpg", "Cáp treo Hòn Thơm", "Cáp treo vượt biển dài nhất thế giới nối An Thới ra đảo Hòn Thơm", "Di chuyển", "Vivu Vietnam", 91),
            new PhotoSeed("phu-quoc", "/images/tours/phu-quoc/03-an-thoi-archipelago.jpg", "Quần đảo An Thới", "Những hòn đảo hoang sơ và tàu du lịch tại quần đảo An Thới", "Toàn cảnh", "Alexey Komarov", 92),
            new PhotoSeed("phu-quoc", "/images/tours/phu-quoc/04-coral-snorkeling.jpg", "Lặn ngắm san hô Phú Quốc", "Vùng biển trong xanh và rạn san hô đảo ngọc Phú Quốc", "Trải nghiệm", "dronepicr", 93),
            new PhotoSeed("phu-quoc", "/images/tours/phu-quoc/05-dinh-cau-sunset.jpg", "Dinh Cậu Phú Quốc", "Ghềnh đá và miếu Dinh Cậu nổi bật trong ánh chiều tà", "Toàn cảnh", "Sketyl none", 94),
            new PhotoSeed("phu-quoc", "/images/tours/phu-quoc/06-ham-ninh-pier.jpg", "Làng chài Hàm Ninh", "Cầu cảng và thuyền cá tại làng chài cổ Hàm Ninh, Phú Quốc", "Trải nghiệm", "Tonbi ko", 95),
            new PhotoSeed("phu-quoc", "/images/tours/phu-quoc/07-phu-quoc-resort.jpg", "Resort ven biển Phú Quốc", "Khu nghỉ dưỡng hướng biển với hồ bơi và rặng dừa xanh mát", "Lưu trú", "Elmschrat", 96),
            new PhotoSeed("phu-quoc", "/images/tours/phu-quoc/08-night-market-seafood.jpg", "Hải sản Chợ đêm Phú Quốc", "Hải sản tươi ngon bày bán nhộn nhịp tại chợ đêm Phú Quốc", "Ẩm thực", "FrogsLegs71", 97),
            new PhotoSeed("phu-quoc", "/images/tours/phu-quoc/09-bai-dai-ganh-dau.jpg", "Bãi Dài & Gành Dầu", "Bờ biển Bãi Dài hoang sơ thanh bình ở phía Bắc đảo ngọc", "Toàn cảnh", "dronepicr", 98),
            new PhotoSeed("phu-quoc", "/images/tours/phu-quoc/10-duong-dong-estuary.jpg", "Cửa biển Dương Đông", "Tàu cá neo đậu bình yên tại cửa sông Dương Đông, Phú Quốc", "Toàn cảnh", "Elmschrat", 99),
            new PhotoSeed("phu-quoc", "/images/tours/phu-quoc/11-west-coast-sunset.jpg", "Hoàng hôn biển Tây Phú Quốc", "Khoảnh khắc hoàng hôn rực rỡ trên vùng biển phía Tây đảo Phú Quốc", "Toàn cảnh", "Eila Lifflander 3ilaliff", 100),

            // Sa Pa (11)
            new PhotoSeed("sa-pa", "/images/tours/sa-pa/01-muong-hoa-terraces.jpg", "Thung lũng Mường Hoa", "Ruộng bậc thang Mường Hoa uốn lượn giữa mây núi Sa Pa", "Toàn cảnh", "Christophe95", 110),
            new PhotoSeed("sa-pa", "/images/tours/sa-pa/02-fansipan-summit.jpg", "Đỉnh Fansipan", "Đỉnh Fansipan - Nóc nhà Đông Dương bồng bềnh trong biển mây", "Toàn cảnh", "Vivu Vietnam", 111),
            new PhotoSeed("sa-pa", "/images/tours/sa-pa/03-fansipan-cable-car.jpg", "Cáp treo Fansipan", "Hệ thống cáp treo Fansipan băng qua thung lũng và mây mù", "Di chuyển", "Vivu Vietnam", 112),
            new PhotoSeed("sa-pa", "/images/tours/sa-pa/04-cat-cat-village.jpg", "Bản Cát Cát", "Bản Cát Cát với những nếp nhà gỗ và sắc màu văn hóa H'Mông", "Trải nghiệm", "Diego Angel", 113),
            new PhotoSeed("sa-pa", "/images/tours/sa-pa/05-silver-waterfall.jpg", "Thác Bạc Sa Pa", "Dòng thác trắng xóa đổ xuống từ núi rừng Hoàng Liên Sơn", "Toàn cảnh", "Weendang", 114),
            new PhotoSeed("sa-pa", "/images/tours/sa-pa/06-sapa-stone-church.jpg", "Nhà thờ đá Sa Pa", "Nhà thờ đá cổ kính tại trung tâm thị xã Sa Pa", "Toàn cảnh", "Christophe95", 115),
            new PhotoSeed("sa-pa", "/images/tours/sa-pa/07-sapa-market.jpg", "Chợ phiên Sa Pa", "Sắc màu thổ cẩm và nông sản tại chợ vùng cao Sa Pa", "Trải nghiệm", "KS Chew", 116),
            new PhotoSeed("sa-pa", "/images/tours/sa-pa/08-muong-hoa-homestay.jpg", "Homestay Mường Hoa", "Nhà sàn gỗ và bản làng giữa ruộng bậc thang ở Sa Pa", "Lưu trú", "Soibien032016", 117),
            new PhotoSeed("sa-pa", "/images/tours/sa-pa/09-sapa-town-hotel.jpg", "Khách sạn trung tâm Sa Pa", "Kiến trúc phố núi và khách sạn tại thị xã Sa Pa", "Lưu trú", "Quangpraha", 118),
            new PhotoSeed("sa-pa", "/images/tours/sa-pa/10-o-quy-ho-pass.jpg", "Đèo Ô Quy Hồ", "Cung đường đèo Ô Quy Hồ hùng vĩ nối Lào Cai và Lai Châu", "Di chuyển", "Liftold (thảo luận)", 119),
            new PhotoSeed("sa-pa", "/images/tours/sa-pa/11-sapa-hotpot-bbq.jpg", "Ẩm thực Tây Bắc Sa Pa", "Nồi lẩu nóng và đồ nướng đặc sản giữa tiết trời se lạnh Sa Pa", "Ẩm thực", "Mozzihh", 120)
    );

    @Override
    public void run(String... args) {
        migrateColumns();
        seedRegions();
        ensureDefaultPasswords();
        if (userRepository.count() == 0) {
            seedInitialData();
        }
        ensureAdminUsers();
        syncRealMediaAndPhotos();
    }

    private void migrateColumns() {
        List<String> ddlStatements = List.of(
                "ALTER TABLE tours ALTER COLUMN gallery_images NVARCHAR(4000)",
                "ALTER TABLE tours ALTER COLUMN gallery_images VARCHAR(4000)",
                "ALTER TABLE app_users ALTER COLUMN role NVARCHAR(20)",
                "ALTER TABLE app_users ALTER COLUMN role VARCHAR(20)",
                "ALTER TABLE app_users ADD COLUMN IF NOT EXISTS demo_account BOOLEAN DEFAULT FALSE",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lock_version BIGINT DEFAULT 0"
        );
        for (String sql : ddlStatements) {
            try {
                jdbcTemplate.execute(sql);
            } catch (Exception ignored) {
                // Thử cú pháp tiếp theo nếu dialect DB khác
            }
        }
    }

    private void seedInitialData() {
        Map<String, Region> r = new HashMap<>();
        regionRepository.findAll().forEach(x -> r.put(x.getCode(), x));

        seedOptions(r);

        // ===== Tài khoản mẫu (mật khẩu demo: 123456) =====
        AppUser binh = user("Trần Văn Bình", Role.GUIDE, "binh.guide@tripbuilder.vn", "0912 345 678",
                AVATAR_BINH,
                "Hướng dẫn viên bản địa Quảng Ninh & Tây Bắc (8 năm kinh nghiệm).", 8, r.get("ha-long"));
        AppUser chi = user("Lê Thị Chi", Role.GUIDE, "chi.guide@tripbuilder.vn", "0987 654 321",
                AVATAR_CHI,
                "Người Đà Lạt gốc, chuyên thiết kế tour nghỉ dưỡng gia đình & săn mây.", 5, r.get("da-lat"));
        AppUser dung = user("Phạm Minh Dũng", Role.GUIDE, "dung.guide@tripbuilder.vn", "0905 111 222",
                AVATAR_DUNG,
                "Thuyết minh viên di sản miền Trung Hội An – Huế.", 6, r.get("hoi-an"));

        AppUser an = user("Nguyễn Văn An", Role.CUSTOMER, "an.nguyen@gmail.com", "0901 234 567",
                AVATAR_AN, null, null, null);
        AppUser hoa = user("Đỗ Thu Hoa", Role.CUSTOMER, "hoa.do@gmail.com", "0934 567 890",
                AVATAR_HOA, null, null, null);
        AppUser khoa = user("Hoàng Minh Khoa", Role.CUSTOMER, "khoa.hoang@gmail.com", "0978 222 333",
                AVATAR_KHOA, null, null, null);

        // ===== 6 Tour Preset kèm 10 ảnh thật / tour =====
        Long tHaLong = tourService.create(new SaveTourRequest(
                binh.getId(), r.get("ha-long").getId(),
                "Hạ Long 2N1Đ — Vịnh đá vôi & Chèo Kayak",
                "Xe Limousine đón tận nơi, nghỉ khách sạn hướng vịnh, chèo Kayak hang Luồn và hải sản bản địa.",
                "/images/tours/ha-long/01-bay-panorama.jpg",
                REGION_GALLERIES.get("ha-long"),
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe Limousine Hà Nội – Hạ Long & Guide đón", 400_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Khách sạn Mường Thanh 4★ hướng vịnh", 700_000, "/images/tours/ha-long/09-bay-view-hotel.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Tàu thăm vịnh & Chèo Kayak hang Luồn", 500_000, "/images/tours/ha-long/05-kayak-luon-cave.jpg"),
                        new TourStepRequest(1, "Ăn uống", "Set hải sản Hạ Long ven biển", 400_000, "/images/tours/ha-long/10-ha-long-seafood.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Cáp treo Nữ Hoàng & Đồi Mặt Trời", 400_000, "/images/tours/ha-long/08-bai-chay-cable-car.jpg"),
                        new TourStepRequest(2, "Di chuyển", "Ăn trưa chả mực & Xe về Hà Nội", 400_000, "/images/tours/ha-long/11-cha-muc-ha-long.jpg")
                )
        )).id();

        tourService.create(new SaveTourRequest(
                binh.getId(), r.get("sa-pa").getId(),
                "Sa Pa 3N2Đ — Bản Cát Cát & Đỉnh Fansipan",
                "Trekking bản H'Mông, săn mây đỉnh Fansipan và thưởng thức lẩu cá hồi suối lạnh.",
                "/images/tours/sa-pa/01-muong-hoa-terraces.jpg",
                REGION_GALLERIES.get("sa-pa"),
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Limousine Hà Nội – Sa Pa & Guide đón", 500_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Homestay gỗ thung lũng Mường Hoa (2 đêm)", 800_000, "/images/tours/sa-pa/08-muong-hoa-homestay.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Trekking bản Cát Cát & Thác Tiên Sa", 300_000, "/images/tours/sa-pa/04-cat-cat-village.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Cáp treo khứ hồi đỉnh Fansipan", 900_000, "/images/tours/sa-pa/03-fansipan-cable-car.jpg"),
                        new TourStepRequest(2, "Ăn uống", "Tiệc tối lẩu cá hồi & đồ nướng", 400_000, "/images/tours/sa-pa/11-sapa-hotpot-bbq.jpg"),
                        new TourStepRequest(3, "Di chuyển", "Chợ phiên Sa Pa & Xe về Hà Nội", 500_000, "/images/tours/sa-pa/07-sapa-market.jpg")
                )
        ));

        Long tDaLat = tourService.create(new SaveTourRequest(
                chi.getId(), r.get("da-lat").getId(),
                "Đà Lạt 3N2Đ — Săn mây Cầu Đất & Đồi thông",
                "Đón bình minh biển mây, hái dâu tại vườn và thưởng thức lẩu gà lá é giữa rừng thông.",
                "/images/tours/da-lat/01-cau-dat-tea-hill.jpg",
                REGION_GALLERIES.get("da-lat"),
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đón sân bay Liên Khương", 300_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Homestay Đồi Thông (2 đêm)", 800_000, "/images/tours/da-lat/09-pine-hill-homestay.jpg"),
                        new TourStepRequest(1, "Ăn uống", "Lẩu gà lá é & dạo chợ đêm", 250_000, "/images/tours/da-lat/07-dalat-night-market.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Xe Jeep săn mây Cầu Đất lúc 5h", 450_000, "/images/tours/da-lat/01-cau-dat-tea-hill.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Vườn dâu & Thung lũng Tình Yêu", 300_000, "/images/tours/da-lat/06-valley-of-love.jpg"),
                        new TourStepRequest(3, "Di chuyển", "Cà phê Mê Linh & Tiễn sân bay", 300_000, "/images/tours/da-lat/10-dalat-coffee.jpg")
                )
        )).id();

        Long tPhuQuoc = tourService.create(new SaveTourRequest(
                chi.getId(), r.get("phu-quoc").getId(),
                "Phú Quốc 3N2Đ — Cano 4 Đảo & San hô",
                "Nghỉ resort ven biển Bãi Trường, cano 4 đảo phía Nam và hải sản chợ đêm Dinh Cậu.",
                "/images/tours/phu-quoc/01-sao-beach.jpg",
                REGION_GALLERIES.get("phu-quoc"),
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Đón sân bay & Làng chài Hàm Ninh", 300_000, "/images/tours/phu-quoc/06-ham-ninh-pier.jpg"),
                        new TourStepRequest(1, "Khách sạn", "Resort 4★ Sol by Meliá (2 đêm)", 1_800_000, "/images/tours/phu-quoc/07-phu-quoc-resort.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Cano 4 đảo & Lặn ngắm san hô", 800_000, "/images/tours/phu-quoc/04-coral-snorkeling.jpg"),
                        new TourStepRequest(2, "Ăn uống", "Hải sản chợ đêm Dinh Cậu", 500_000, "/images/tours/phu-quoc/08-night-market-seafood.jpg"),
                        new TourStepRequest(3, "Di chuyển", "Hoàng hôn Sunset Sanato & Tiễn bay", 300_000, "/images/tours/phu-quoc/11-west-coast-sunset.jpg")
                )
        )).id();

        Long tHoiAn = tourService.create(new SaveTourRequest(
                dung.getId(), r.get("hoi-an").getId(),
                "Hội An 2N1Đ — Đèn lồng & Rừng dừa Bảy Mẫu",
                "Thả hoa đăng sông Hoài, thuyền thúng rừng dừa Bảy Mẫu và thưởng thức Cao lầu phố cổ.",
                "/images/tours/hoi-an/01-ancient-town-lanterns.jpg",
                REGION_GALLERIES.get("hoi-an"),
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe đón Đà Nẵng – Hội An", 300_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Hội An Riverside Villa ven sông", 600_000, "/images/tours/hoi-an/09-riverside-villa.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Phố cổ & Thả đèn hoa đăng", 300_000, "/images/tours/hoi-an/03-lantern-street-night.jpg"),
                        new TourStepRequest(1, "Ăn uống", "Cao lầu, Cơm gà & Bánh mì Phượng", 250_000, "/images/tours/hoi-an/10-cao-lau-hoi-an.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Thuyền thúng Rừng dừa & Nấu ăn", 550_000, "/images/tours/hoi-an/05-bay-mau-basket-boat.jpg")
                )
        )).id();

        tourService.create(new SaveTourRequest(
                dung.getId(), r.get("hue").getId(),
                "Cố đô Huế 2N1Đ — Đại Nội & Ca Huế sông Hương",
                "Khám phá di sản triều Nguyễn cùng thuyết minh viên bản địa, ca Huế thuyền rồng và cơm Vua.",
                "/images/tours/hue/01-ngo-mon-gate.jpg",
                REGION_GALLERIES.get("hue"),
                2,
                List.of(
                        new TourStepRequest(1, "Khách sạn", "Saigon Morin 4★ bên sông Hương", 700_000, "/images/tours/hue/09-hue-heritage-hotel.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Đại Nội & Lăng Tự Đức – Khải Định", 450_000, "/images/tours/hue/02-thai-hoa-palace.jpg"),
                        new TourStepRequest(1, "Ăn uống", "Cơm cung đình & Ca Huế sông Hương", 450_000, "/images/tours/hue/06-perfume-river-dragon-boat.jpg"),
                        new TourStepRequest(2, "Di chuyển", "Đầm Lập An & Tiễn sân bay", 300_000, "/images/tours/hue/08-lap-an-lagoon.jpg")
                )
        ));

        // ===== 4 Booking mẫu đại diện quy trình =====
        LocalDate today = LocalDate.now();

        bookingService.create(new CreateBookingRequest(
                tHaLong, an.getId(), today.plusDays(15), 2, 2, "COMPANION",
                "Kỷ niệm ngày cưới, muốn đổi sang du thuyền 5★ và chuẩn bị bánh kem tại cabin.",
                true,
                List.of(
                        new BookingStepRequest(1, "Di chuyển", "Xe Limousine Hà Nội – Hạ Long & Guide đón", 400_000, "Xe Limousine Hà Nội – Hạ Long & Guide đón", 400_000L, "PRESET", IMG_LIMO),
                        new BookingStepRequest(1, "Khách sạn", "Du thuyền Paradise 5★ ngủ đêm trên vịnh", 1_800_000, "Khách sạn Mường Thanh 4★ hướng vịnh", 700_000L, "MODIFIED", "/images/tours/ha-long/04-cruise-bay.jpg"),
                        new BookingStepRequest(1, "Trải nghiệm", "Tàu thăm vịnh & Chèo Kayak hang Luồn", 500_000, "Tàu thăm vịnh & Chèo Kayak hang Luồn", 500_000L, "PRESET", "/images/tours/ha-long/05-kayak-luon-cave.jpg"),
                        new BookingStepRequest(1, "Ăn uống", "Set hải sản Hạ Long ven biển", 400_000, "Set hải sản Hạ Long ven biển", 400_000L, "PRESET", "/images/tours/ha-long/10-ha-long-seafood.jpg"),
                        new BookingStepRequest(1, "Yêu cầu thêm", "Chuẩn bị bánh kem & hoa kỷ niệm tại cabin", 0, null, 0L, "CUSTOM", "/images/tours/ha-long/04-cruise-bay.jpg"),
                        new BookingStepRequest(2, "Trải nghiệm", "Cáp treo Nữ Hoàng & Đồi Mặt Trời", 0, "Cáp treo Nữ Hoàng & Đồi Mặt Trời", 400_000L, "REMOVED", "/images/tours/ha-long/08-bai-chay-cable-car.jpg"),
                        new BookingStepRequest(2, "Di chuyển", "Ăn trưa chả mực & Xe về Hà Nội", 400_000, "Ăn trưa chả mực & Xe về Hà Nội", 400_000L, "PRESET", "/images/tours/ha-long/11-cha-muc-ha-long.jpg")
                )
        ));

        Long b2 = bookingService.create(new CreateBookingRequest(
                tDaLat, hoa.getId(), today.plusDays(20), 3, 4, "REMOTE",
                "Gia đình tự lái xe, nhờ Chi đặt giữ phòng và tiệc nướng BBQ tối Ngày 2.",
                true,
                List.of(
                        new BookingStepRequest(1, "Di chuyển", "Xe riêng đón sân bay Liên Khương", 0, "Xe riêng đón sân bay Liên Khương", 300_000L, "REMOVED", IMG_LIMO),
                        new BookingStepRequest(1, "Khách sạn", "Homestay Đồi Thông (2 đêm)", 800_000, "Homestay Đồi Thông (2 đêm)", 800_000L, "PRESET", "/images/tours/da-lat/09-pine-hill-homestay.jpg"),
                        new BookingStepRequest(1, "Ăn uống", "Lẩu gà lá é & dạo chợ đêm", 250_000, "Lẩu gà lá é & dạo chợ đêm", 250_000L, "PRESET", "/images/tours/da-lat/07-dalat-night-market.jpg"),
                        new BookingStepRequest(2, "Trải nghiệm", "Xe Jeep săn mây Cầu Đất lúc 5h", 450_000, "Xe Jeep săn mây Cầu Đất lúc 5h", 450_000L, "PRESET", "/images/tours/da-lat/01-cau-dat-tea-hill.jpg"),
                        new BookingStepRequest(2, "Trải nghiệm", "Vườn dâu & Thung lũng Tình Yêu", 300_000, "Vườn dâu & Thung lũng Tình Yêu", 300_000L, "PRESET", "/images/tours/da-lat/06-valley-of-love.jpg"),
                        new BookingStepRequest(2, "Yêu cầu thêm", "Tiệc nướng BBQ sân vườn tối Ngày 2", 0, null, 0L, "CUSTOM", IMG_BBQ),
                        new BookingStepRequest(3, "Di chuyển", "Cà phê Mê Linh & Tiễn sân bay", 300_000, "Cà phê Mê Linh & Tiễn sân bay", 300_000L, "PRESET", "/images/tours/da-lat/10-dalat-coffee.jpg")
                )
        )).id();
        bookingService.requote(b2, new RequoteRequest(
                3, 4, -400_000L,
                "Homestay Đồi Thông kín phòng cuối tuần, mình đề xuất đổi sang Biệt thự Ana Mandara 5★ và báo giá BBQ 350.000đ/khách kèm giảm 400.000đ cho đoàn.",
                List.of(
                        new BookingStepRequest(1, "Di chuyển", "Xe riêng đón sân bay Liên Khương", 0, "Xe riêng đón sân bay Liên Khương", 300_000L, "REMOVED", IMG_LIMO),
                        new BookingStepRequest(1, "Khách sạn", "Biệt thự Ana Mandara Villas 5★ (2 đêm)", 1_500_000, "Homestay Đồi Thông (2 đêm)", 800_000L, "ALTERNATIVE", "/images/tours/da-lat/08-french-villa-dalat.jpg"),
                        new BookingStepRequest(1, "Ăn uống", "Lẩu gà lá é & dạo chợ đêm", 250_000, "Lẩu gà lá é & dạo chợ đêm", 250_000L, "PRESET", "/images/tours/da-lat/07-dalat-night-market.jpg"),
                        new BookingStepRequest(2, "Trải nghiệm", "Xe Jeep săn mây Cầu Đất lúc 5h", 450_000, "Xe Jeep săn mây Cầu Đất lúc 5h", 450_000L, "PRESET", "/images/tours/da-lat/01-cau-dat-tea-hill.jpg"),
                        new BookingStepRequest(2, "Trải nghiệm", "Vườn dâu & Thung lũng Tình Yêu", 300_000, "Vườn dâu & Thung lũng Tình Yêu", 300_000L, "PRESET", "/images/tours/da-lat/06-valley-of-love.jpg"),
                        new BookingStepRequest(2, "Yêu cầu thêm", "Tiệc nướng BBQ sân vườn tối Ngày 2", 350_000, null, 0L, "GUIDE", IMG_BBQ),
                        new BookingStepRequest(3, "Di chuyển", "Cà phê Mê Linh & Tiễn sân bay", 300_000, "Cà phê Mê Linh & Tiễn sân bay", 300_000L, "PRESET", "/images/tours/da-lat/10-dalat-coffee.jpg")
                )
        ));

        bookingService.create(new CreateBookingRequest(
                tHoiAn, khoa.getId(), today.plusDays(25), 2, 2, "REMOTE",
                "Nhờ anh Dũng đặt giữ villa ven sông và bàn Cao lầu tối Ngày 1.",
                false, null
        ));

        Long b4 = bookingService.create(new CreateBookingRequest(
                tPhuQuoc, an.getId(), today.plusDays(45), 3, 2, "COMPANION",
                "Giữ nguyên lịch trình chuẩn Phú Quốc.",
                false, null
        )).id();
        bookingService.confirm(b4);
        bookingService.review(b4, new ReviewRequest(
                5,
                "Guide Lê Thị Chi đặt trước cano và bàn hải sản view hoàng hôn rất chu đáo!"
        ));

        log.info("Seeded TripBuilder dataset with auth & local real media");
    }

    private void syncRealMediaAndPhotos() {
        transactionTemplate.executeWithoutResult(status -> {
            Map<String, Region> regionByCode = new HashMap<>();
            regionRepository.findAll().forEach(reg -> regionByCode.put(reg.getCode(), reg));

            // 1. Đồng bộ bảng region_photos (72 ảnh: 66 ảnh vùng + 6 ảnh activities dùng chung)
            Map<String, RegionPhoto> existingPhotos = new HashMap<>();
            regionPhotoRepository.findAll().forEach(p -> existingPhotos.put(p.getUrl(), p));
            for (PhotoSeed seed : PHOTO_CATALOG) {
                Region reg = seed.regionCode() != null ? regionByCode.get(seed.regionCode()) : null;
                RegionPhoto photo = existingPhotos.getOrDefault(seed.url(), new RegionPhoto());
                photo.setRegion(reg);
                photo.setUrl(seed.url());
                photo.setLandmarkName(seed.landmarkName());
                photo.setCaption(seed.caption());
                photo.setCategory(seed.category());
                photo.setCredit(seed.credit());
                photo.setSortOrder(seed.sortOrder());
                regionPhotoRepository.save(photo);
            }

            // 2. Quét bảng regions
            for (Region reg : regionByCode.values()) {
                if (needsLocalReplace(reg.getImageUrl())) {
                    List<String> gallery = REGION_GALLERIES.get(reg.getCode());
                    if (gallery != null && !gallery.isEmpty()) {
                        reg.setImageUrl(gallery.get(0));
                        regionRepository.save(reg);
                    }
                }
            }

            // 3. Quét bảng users
            List<AppUser> users = userRepository.findAll();
            for (AppUser u : users) {
                if (needsLocalReplace(u.getAvatarUrl())) {
                    u.setAvatarUrl(resolveAvatar(u));
                    userRepository.save(u);
                }
            }

            // 4. Quét bảng preset_options
            List<PresetOption> options = optionRepository.findAll();
            for (PresetOption o : options) {
                if (needsLocalReplace(o.getImageUrl())) {
                    String code = o.getRegion() != null ? o.getRegion().getCode() : null;
                    o.setImageUrl(resolveStepImage(code, o.getCategory(), o.getTitle()));
                    optionRepository.save(o);
                }
            }

            // 5. Quét bảng tours & tour_steps
            List<Tour> tours = tourRepository.findAll();
            for (Tour t : tours) {
                String code = t.getRegion() != null ? t.getRegion().getCode() : null;
                List<String> regionGallery = code != null ? REGION_GALLERIES.get(code) : null;
                boolean tourChanged = false;
                if (needsLocalReplace(t.getImageUrl()) && regionGallery != null && !regionGallery.isEmpty()) {
                    t.setImageUrl(regionGallery.get(0));
                    tourChanged = true;
                }
                int currentGalleryCount = countGalleryItems(t.getGalleryImages());
                if ((needsLocalReplace(t.getGalleryImages()) || currentGalleryCount < 8)
                        && regionGallery != null && !regionGallery.isEmpty()) {
                    t.setGalleryImages(String.join("|", regionGallery));
                    tourChanged = true;
                }
                for (TourStep ts : t.getSteps()) {
                    if (needsLocalReplace(ts.getImageUrl())) {
                        ts.setImageUrl(resolveStepImage(code, ts.getCategory(), ts.getTitle()));
                        tourChanged = true;
                    }
                }
                if (tourChanged) {
                    tourRepository.save(t);
                }
            }

            // 6. Quét bảng booking_steps
            List<Booking> bookings = bookingRepository.findAll();
            for (Booking b : bookings) {
                String code = (b.getTour() != null && b.getTour().getRegion() != null)
                        ? b.getTour().getRegion().getCode()
                        : null;
                boolean bookingChanged = false;
                for (BookingStep bs : b.getSteps()) {
                    if (needsLocalReplace(bs.getImageUrl())) {
                        bs.setImageUrl(resolveStepImage(code, bs.getCategory(), bs.getTitle()));
                        bookingChanged = true;
                    }
                }
                if (bookingChanged) {
                    bookingRepository.save(b);
                }
            }

            // 7. Seed 2 SavedTour mẫu cho an.nguyen@gmail.com nếu chưa có
            users.stream()
                    .filter(u -> "an.nguyen@gmail.com".equalsIgnoreCase(u.getEmail()))
                    .findFirst()
                    .ifPresent(an -> {
                        if (savedTourRepository.findByCustomerIdOrderByCreatedAtDesc(an.getId()).isEmpty()) {
                            List<Tour> allTours = tourRepository.findAllByOrderByIdDesc();
                            allTours.stream().limit(2).forEach(t -> savedTourRepository.save(SavedTour.builder()
                                    .customer(an)
                                    .tour(t)
                                    .createdAt(LocalDateTime.now())
                                    .build()));
                        }
                    });
        });
    }

    private static boolean needsLocalReplace(String url) {
        return url == null || url.isBlank() || url.contains("images.unsplash.com");
    }

    private static int countGalleryItems(String galleryImages) {
        if (galleryImages == null || galleryImages.isBlank()) return 0;
        int count = 0;
        for (String s : galleryImages.split("\\|")) {
            if (!s.isBlank()) count++;
        }
        return count;
    }

    private static String resolveAvatar(AppUser u) {
        String email = u.getEmail() == null ? "" : u.getEmail().toLowerCase(Locale.ROOT);
        if (email.contains("binh")) return AVATAR_BINH;
        if (email.contains("chi")) return AVATAR_CHI;
        if (email.contains("dung")) return AVATAR_DUNG;
        if (email.contains("hoa")) return AVATAR_HOA;
        if (email.contains("an")) return AVATAR_AN;
        if (email.contains("khoa")) return AVATAR_KHOA;
        return u.getRole() == Role.GUIDE ? AVATAR_BINH : AVATAR_AN;
    }

    private static String resolveStepImage(String regionCode, String category, String title) {
        String t = title == null ? "" : title.toLowerCase(Locale.ROOT);
        String c = category == null ? "" : category.toLowerCase(Locale.ROOT);

        if ("ha-long".equals(regionCode)) {
            if (t.contains("du thuyền") || t.contains("cabin")) return "/images/tours/ha-long/04-cruise-bay.jpg";
            if (t.contains("kayak")) return "/images/tours/ha-long/05-kayak-luon-cave.jpg";
            if (t.contains("cáp treo")) return "/images/tours/ha-long/08-bai-chay-cable-car.jpg";
            if (t.contains("chả mực")) return "/images/tours/ha-long/11-cha-muc-ha-long.jpg";
            if (t.contains("hải sản") || c.contains("ăn")) return "/images/tours/ha-long/10-ha-long-seafood.jpg";
            if (c.contains("khách sạn") || t.contains("resort") || t.contains("onsen")) return "/images/tours/ha-long/09-bay-view-hotel.jpg";
            if (c.contains("di chuyển")) return IMG_LIMO;
            return "/images/tours/ha-long/02-titop-island.jpg";
        }
        if ("da-lat".equals(regionCode)) {
            if (t.contains("homestay")) return "/images/tours/da-lat/09-pine-hill-homestay.jpg";
            if (t.contains("biệt thự") || t.contains("ana mandara") || c.contains("khách sạn")) return "/images/tours/da-lat/08-french-villa-dalat.jpg";
            if (t.contains("bbq")) return IMG_BBQ;
            if (t.contains("cà phê")) return "/images/tours/da-lat/10-dalat-coffee.jpg";
            if (t.contains("chợ đêm") || t.contains("lẩu") || c.contains("ăn")) return "/images/tours/da-lat/07-dalat-night-market.jpg";
            if (t.contains("datanla")) return "/images/tours/da-lat/04-datanla-waterfall.jpg";
            if (t.contains("vườn dâu") || t.contains("thung lũng")) return "/images/tours/da-lat/06-valley-of-love.jpg";
            if (c.contains("di chuyển")) return IMG_LIMO;
            return "/images/tours/da-lat/01-cau-dat-tea-hill.jpg";
        }
        if ("hoi-an".equals(regionCode)) {
            if (t.contains("thúng") || t.contains("rừng dừa")) return "/images/tours/hoi-an/05-bay-mau-basket-boat.jpg";
            if (t.contains("đèn") || t.contains("phố cổ") || t.contains("ký ức")) return "/images/tours/hoi-an/03-lantern-street-night.jpg";
            if (t.contains("cao lầu") || t.contains("bánh mì") || c.contains("ăn")) return "/images/tours/hoi-an/10-cao-lau-hoi-an.jpg";
            if (c.contains("khách sạn") || t.contains("villa") || t.contains("resort")) return "/images/tours/hoi-an/09-riverside-villa.jpg";
            if (c.contains("di chuyển")) return IMG_LIMO;
            return "/images/tours/hoi-an/01-ancient-town-lanterns.jpg";
        }
        if ("sa-pa".equals(regionCode)) {
            if (t.contains("fansipan") || t.contains("cáp treo")) return "/images/tours/sa-pa/03-fansipan-cable-car.jpg";
            if (t.contains("cát cát")) return "/images/tours/sa-pa/04-cat-cat-village.jpg";
            if (t.contains("chợ phiên")) return "/images/tours/sa-pa/07-sapa-market.jpg";
            if (t.contains("homestay")) return "/images/tours/sa-pa/08-muong-hoa-homestay.jpg";
            if (c.contains("khách sạn") || t.contains("hotel")) return "/images/tours/sa-pa/09-sapa-town-hotel.jpg";
            if (c.contains("ăn") || t.contains("lẩu")) return "/images/tours/sa-pa/11-sapa-hotpot-bbq.jpg";
            if (c.contains("di chuyển")) return IMG_LIMO;
            return "/images/tours/sa-pa/01-muong-hoa-terraces.jpg";
        }
        if ("phu-quoc".equals(regionCode)) {
            if (t.contains("san hô") || t.contains("4 đảo")) return "/images/tours/phu-quoc/04-coral-snorkeling.jpg";
            if (t.contains("cáp treo") || t.contains("hòn thơm")) return "/images/tours/phu-quoc/02-hon-thom-cable-car.jpg";
            if (t.contains("hàm ninh")) return "/images/tours/phu-quoc/06-ham-ninh-pier.jpg";
            if (t.contains("hoàng hôn") || t.contains("sunset")) return "/images/tours/phu-quoc/11-west-coast-sunset.jpg";
            if (c.contains("khách sạn") || t.contains("resort")) return "/images/tours/phu-quoc/07-phu-quoc-resort.jpg";
            if (c.contains("ăn") || t.contains("hải sản")) return "/images/tours/phu-quoc/08-night-market-seafood.jpg";
            return "/images/tours/phu-quoc/01-sao-beach.jpg";
        }
        if ("hue".equals(regionCode)) {
            if (t.contains("đại nội") || t.contains("lăng")) return "/images/tours/hue/02-thai-hoa-palace.jpg";
            if (t.contains("ca huế") || t.contains("sông hương") || c.contains("ăn")) return "/images/tours/hue/06-perfume-river-dragon-boat.jpg";
            if (t.contains("lập an")) return "/images/tours/hue/08-lap-an-lagoon.jpg";
            if (c.contains("khách sạn") || t.contains("resort") || t.contains("morin")) return "/images/tours/hue/09-hue-heritage-hotel.jpg";
            if (c.contains("di chuyển")) return IMG_LIMO;
            return "/images/tours/hue/01-ngo-mon-gate.jpg";
        }

        if (c.contains("di chuyển")) return IMG_LIMO;
        if (c.contains("ăn")) return IMG_VIET_FOOD;
        if (c.contains("khách sạn")) return IMG_RESORT_SPA;
        return IMG_COFFEE;
    }

    private void ensureAdminUsers() {
        if (userRepository.findByEmailIgnoreCase("admin@tripbuilder.vn").isEmpty()) {
            user("Nguyễn Quản Trị", Role.ADMIN, "admin@tripbuilder.vn", "0901000001",
                    AVATAR_BINH, "Quản trị viên tổng hệ thống TripBuilder.", null, null);
        }
        if (userRepository.findByEmailIgnoreCase("operator@tripbuilder.vn").isEmpty()) {
            user("Trần Điều Hành", Role.ADMIN, "operator@tripbuilder.vn", "0901000002",
                    AVATAR_CHI, "Điều hành viên toàn sàn TripBuilder.", null, null);
        }
    }

    private static final java.util.Set<String> SEEDED_DEMO_EMAILS = java.util.Set.of(
            "binh.guide@tripbuilder.vn",
            "chi.guide@tripbuilder.vn",
            "dung.guide@tripbuilder.vn",
            "an.nguyen@gmail.com",
            "hoa.do@gmail.com",
            "khoa.hoang@gmail.com",
            "admin@tripbuilder.vn",
            "operator@tripbuilder.vn"
    );

    private void ensureDefaultPasswords() {
        String defaultHash = AuthService.hashPassword("123456");
        List<AppUser> users = userRepository.findAll();
        boolean changed = false;
        for (AppUser u : users) {
            if (u.getPasswordHash() == null || u.getPasswordHash().isBlank()) {
                u.setPasswordHash(defaultHash);
                changed = true;
            }
            if (!u.isDemoAccount() && u.getEmail() != null
                    && SEEDED_DEMO_EMAILS.contains(u.getEmail().trim().toLowerCase(Locale.ROOT))) {
                u.setDemoAccount(true);
                changed = true;
            }
        }
        if (changed) {
            userRepository.saveAll(users);
        }
    }

    private void seedOptions(Map<String, Region> r) {
        Region hl = r.get("ha-long"), dl = r.get("da-lat"), ha = r.get("hoi-an"),
                sp = r.get("sa-pa"), pq = r.get("phu-quoc"), hue = r.get("hue");

        opt(hl, "Khách sạn", "Khách sạn Mường Thanh 4★ hướng vịnh", 700_000, "/images/tours/ha-long/09-bay-view-hotel.jpg");
        opt(hl, "Khách sạn", "Du thuyền Paradise 5★ ngủ đêm trên vịnh", 1_800_000, "/images/tours/ha-long/04-cruise-bay.jpg");
        opt(hl, "Khách sạn", "Vinpearl Resort & Spa Hạ Long 5★", 1_600_000, IMG_RESORT_SPA);
        opt(hl, "Trải nghiệm", "Tàu thăm vịnh & Chèo Kayak hang Luồn", 500_000, "/images/tours/ha-long/05-kayak-luon-cave.jpg");
        opt(hl, "Trải nghiệm", "Cáp treo Nữ Hoàng & Đồi Mặt Trời", 400_000, "/images/tours/ha-long/08-bai-chay-cable-car.jpg");
        opt(hl, "Trải nghiệm", "Tắm khoáng nóng Yoko Onsen Quang Hanh", 900_000, IMG_RESORT_SPA);
        opt(hl, "Ăn uống", "Set hải sản Hạ Long ven biển", 400_000, "/images/tours/ha-long/10-ha-long-seafood.jpg");
        opt(hl, "Ăn uống", "Buffet hải sản tối trên du thuyền", 750_000, IMG_SEAFOOD);
        opt(hl, "Di chuyển", "Xe Limousine Hà Nội – Hạ Long & Guide đón", 400_000, IMG_LIMO);
        opt(hl, "Di chuyển", "Xe riêng 7 chỗ đón tận nhà", 650_000, IMG_LIMO);

        opt(dl, "Khách sạn", "Homestay Đồi Thông (2 đêm)", 800_000, "/images/tours/da-lat/09-pine-hill-homestay.jpg");
        opt(dl, "Khách sạn", "Homestay Làng Thông Xanh săn mây (2 đêm)", 900_000, "/images/tours/da-lat/09-pine-hill-homestay.jpg");
        opt(dl, "Khách sạn", "Biệt thự Ana Mandara Villas 5★ (2 đêm)", 1_500_000, "/images/tours/da-lat/08-french-villa-dalat.jpg");
        opt(dl, "Trải nghiệm", "Xe Jeep săn mây Cầu Đất lúc 5h", 450_000, "/images/tours/da-lat/01-cau-dat-tea-hill.jpg");
        opt(dl, "Trải nghiệm", "Vườn dâu & Thung lũng Tình Yêu", 300_000, "/images/tours/da-lat/06-valley-of-love.jpg");
        opt(dl, "Trải nghiệm", "Trượt thác Datanla & Đồi Robin", 350_000, "/images/tours/da-lat/04-datanla-waterfall.jpg");
        opt(dl, "Ăn uống", "Tiệc nướng BBQ sân vườn buổi tối", 350_000, IMG_BBQ);
        opt(dl, "Ăn uống", "Lẩu gà lá é & dạo chợ đêm", 250_000, "/images/tours/da-lat/07-dalat-night-market.jpg");
        opt(dl, "Di chuyển", "Xe riêng đón sân bay Liên Khương", 300_000, IMG_LIMO);

        opt(ha, "Khách sạn", "Hội An Riverside Villa ven sông", 600_000, "/images/tours/hoi-an/09-riverside-villa.jpg");
        opt(ha, "Khách sạn", "Victoria Hội An Beach Resort 4★", 1_400_000, "/images/tours/hoi-an/08-an-bang-beach.jpg");
        opt(ha, "Trải nghiệm", "Thuyền thúng Rừng dừa & Nấu ăn", 550_000, "/images/tours/hoi-an/05-bay-mau-basket-boat.jpg");
        opt(ha, "Trải nghiệm", "Phố cổ & Thả đèn hoa đăng", 300_000, "/images/tours/hoi-an/03-lantern-street-night.jpg");
        opt(ha, "Trải nghiệm", "Show thực cảnh Ký Ức Hội An", 600_000, "/images/tours/hoi-an/01-ancient-town-lanterns.jpg");
        opt(ha, "Ăn uống", "Cao lầu, Cơm gà & Bánh mì Phượng", 250_000, "/images/tours/hoi-an/10-cao-lau-hoi-an.jpg");
        opt(ha, "Di chuyển", "Xe đón Đà Nẵng – Hội An", 300_000, IMG_LIMO);

        opt(sp, "Khách sạn", "Homestay gỗ thung lũng Mường Hoa (2 đêm)", 800_000, "/images/tours/sa-pa/08-muong-hoa-homestay.jpg");
        opt(sp, "Khách sạn", "Hotel de la Coupole 5★ (2 đêm)", 2_200_000, "/images/tours/sa-pa/09-sapa-town-hotel.jpg");
        opt(sp, "Trải nghiệm", "Cáp treo khứ hồi đỉnh Fansipan", 900_000, "/images/tours/sa-pa/03-fansipan-cable-car.jpg");
        opt(sp, "Trải nghiệm", "Trekking bản Cát Cát & Thác Tiên Sa", 300_000, "/images/tours/sa-pa/04-cat-cat-village.jpg");
        opt(sp, "Ăn uống", "Tiệc tối lẩu cá hồi & đồ nướng", 400_000, "/images/tours/sa-pa/11-sapa-hotpot-bbq.jpg");
        opt(sp, "Di chuyển", "Limousine Hà Nội – Sa Pa & Guide đón", 500_000, IMG_LIMO);

        opt(pq, "Khách sạn", "Resort 4★ Sol by Meliá (2 đêm)", 1_800_000, "/images/tours/phu-quoc/07-phu-quoc-resort.jpg");
        opt(pq, "Khách sạn", "Resort 5★ JW Marriott Bãi Khem (2 đêm)", 3_500_000, IMG_RESORT_SPA);
        opt(pq, "Trải nghiệm", "Cano 4 đảo & Lặn ngắm san hô", 800_000, "/images/tours/phu-quoc/04-coral-snorkeling.jpg");
        opt(pq, "Trải nghiệm", "Cáp treo Hòn Thơm vượt biển", 600_000, "/images/tours/phu-quoc/02-hon-thom-cable-car.jpg");
        opt(pq, "Ăn uống", "Hải sản chợ đêm Dinh Cậu", 500_000, "/images/tours/phu-quoc/08-night-market-seafood.jpg");
        opt(pq, "Di chuyển", "Đón sân bay & Làng chài Hàm Ninh", 300_000, "/images/tours/phu-quoc/06-ham-ninh-pier.jpg");

        opt(hue, "Khách sạn", "Saigon Morin 4★ bên sông Hương", 700_000, "/images/tours/hue/09-hue-heritage-hotel.jpg");
        opt(hue, "Khách sạn", "Pilgrimage Village Resort 5★", 1_500_000, IMG_RESORT_SPA);
        opt(hue, "Trải nghiệm", "Đại Nội & Lăng Tự Đức – Khải Định", 450_000, "/images/tours/hue/02-thai-hoa-palace.jpg");
        opt(hue, "Ăn uống", "Cơm cung đình & Ca Huế sông Hương", 450_000, "/images/tours/hue/06-perfume-river-dragon-boat.jpg");
        opt(hue, "Di chuyển", "Đầm Lập An & Tiễn sân bay", 300_000, "/images/tours/hue/08-lap-an-lagoon.jpg");
    }

    private void opt(Region region, String cat, String title, long price, String img) {
        optionRepository.save(PresetOption.builder()
                .region(region).category(cat).title(title).pricePerPerson(price).imageUrl(img).build());
    }

    private AppUser user(String name, Role role, String email, String phone, String avatarUrl,
                         String bio, Integer years, Region region) {
        return userRepository.save(AppUser.builder()
                .fullName(name)
                .role(role)
                .email(email)
                .passwordHash(AuthService.hashPassword("123456"))
                .phone(phone)
                .avatarUrl(avatarUrl)
                .bio(bio)
                .yearsExperience(years)
                .region(region)
                .demoAccount(true)
                .build());
    }

    private void seedRegions() {
        if (regionRepository.count() > 0) return;
        regionRepository.saveAll(List.of(
                region("ha-long", "Vịnh Hạ Long", "Quảng Ninh", "Biển đảo", 4.9, 1,
                        "Di sản vịnh đá vôi, du thuyền và hải sản.",
                        "/images/tours/ha-long/01-bay-panorama.jpg"),
                region("da-lat", "Đà Lạt", "Lâm Đồng", "Núi rừng", 4.8, 2,
                        "Săn mây, đồi thông và homestay bản địa.",
                        "/images/tours/da-lat/01-cau-dat-tea-hill.jpg"),
                region("hoi-an", "Phố cổ Hội An", "Quảng Nam", "Văn hoá", 4.9, 3,
                        "Đèn lồng sông Hoài và ẩm thực phố cổ.",
                        "/images/tours/hoi-an/01-ancient-town-lanterns.jpg"),
                region("sa-pa", "Sa Pa", "Lào Cai", "Trekking", 4.7, 4,
                        "Ruộng bậc thang, bản làng và đỉnh Fansipan.",
                        "/images/tours/sa-pa/01-muong-hoa-terraces.jpg"),
                region("phu-quoc", "Phú Quốc", "Kiên Giang", "Nghỉ dưỡng", 4.8, 5,
                        "Biển xanh, cano 4 đảo và ngắm san hô.",
                        "/images/tours/phu-quoc/01-sao-beach.jpg"),
                region("hue", "Cố đô Huế", "Thừa Thiên Huế", "Lịch sử", 4.7, 6,
                        "Đại Nội, lăng tẩm và ca Huế sông Hương.",
                        "/images/tours/hue/01-ngo-mon-gate.jpg")
        ));
    }

    private Region region(String code, String name, String province, String tag, double rating, int order,
                          String desc, String img) {
        return Region.builder().code(code).name(name).province(province).tag(tag).rating(rating)
                .sortOrder(order).description(desc).imageUrl(img).build();
    }
}
