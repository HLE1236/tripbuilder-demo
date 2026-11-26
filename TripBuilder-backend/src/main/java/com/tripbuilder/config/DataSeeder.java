package com.tripbuilder.config;

import com.tripbuilder.dto.request.booking.BookingStepRequest;
import com.tripbuilder.dto.request.booking.CancelBookingRequest;
import com.tripbuilder.dto.request.booking.CreateBookingRequest;
import com.tripbuilder.dto.request.booking.CustomizeRequest;
import com.tripbuilder.dto.request.booking.RequoteRequest;
import com.tripbuilder.dto.request.booking.ReviewRequest;
import com.tripbuilder.dto.request.tour.SaveTourRequest;
import com.tripbuilder.dto.request.tour.TourStepRequest;
import com.tripbuilder.entity.booking.Booking;
import com.tripbuilder.entity.booking.BookingStep;
import com.tripbuilder.entity.catalog.PresetOption;
import com.tripbuilder.entity.favorite.SavedTour;
import com.tripbuilder.entity.guide.GuideApplication;
import com.tripbuilder.entity.guide.GuideApplicationStatus;
import com.tripbuilder.entity.region.Region;
import com.tripbuilder.entity.region.RegionPhoto;
import com.tripbuilder.entity.tour.Tour;
import com.tripbuilder.entity.tour.TourStep;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.repository.BookingRepository;
import com.tripbuilder.repository.GuideApplicationRepository;
import com.tripbuilder.repository.PresetOptionRepository;
import com.tripbuilder.repository.RegionPhotoRepository;
import com.tripbuilder.repository.RegionRepository;
import com.tripbuilder.repository.SavedTourRepository;
import com.tripbuilder.repository.TourRepository;
import com.tripbuilder.repository.UserRepository;
import com.tripbuilder.service.auth.AuthService;
import com.tripbuilder.service.booking.BookingService;
import com.tripbuilder.service.tour.TourService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
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
    private final GuideApplicationRepository guideApplicationRepository;
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

    // Wikimedia Commons URLs đã kiểm tra HTTP 200 cho 6 vùng mới
    private static final String NB_TRANG_AN = "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/99/Trang_An_Landscape_Complex%2C_Ninh_Binh_Province%2C_Vietnam%2C_20240202_1340_5144.jpg/1280px-Trang_An_Landscape_Complex%2C_Ninh_Binh_Province%2C_Vietnam%2C_20240202_1340_5144.jpg";
    private static final String NB_TAM_COC = "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b7/TamCoc-BichDong.jpg/1280px-TamCoc-BichDong.jpg";
    private static final String NB_HANG_MUA = "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2f/View_from_Hang_Mua.jpg/1280px-View_from_Hang_Mua.jpg";
    private static final String NB_BAI_DINH = "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fc/Bai_Dinh_Pagoda_%2836519413585%29.jpg/1280px-Bai_Dinh_Pagoda_%2836519413585%29.jpg";
    private static final String NB_HOA_LU = "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Ancient_capital_of_Hoa_Lu%2C_10th_century_%281%29_%2838445751276%29.jpg/1280px-Ancient_capital_of_Hoa_Lu%2C_10th_century_%281%29_%2838445751276%29.jpg";
    private static final String NB_PANORAMA = "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/76/Tam_Coc_Panorama_%288604887215%29.jpg/1280px-Tam_Coc_Panorama_%288604887215%29.jpg";

    private static final String HG_MA_PI_LENG = "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/46/Ma_Pi_Leng_Pass_winding_road_Ha_Giang_Vietnam.jpg/1280px-Ma_Pi_Leng_Pass_winding_road_Ha_Giang_Vietnam.jpg";
    private static final String HG_NHO_QUE = "https://upload.wikimedia.org/wikipedia/commons/b/b7/SongNhoQue.JPG";
    private static final String HG_TU_SAN = "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/TuSan_Canyon.jpg/1280px-TuSan_Canyon.jpg";
    private static final String HG_LUNG_CU = "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/48/Lung_Cu_flag_tower_of_Ha_Giang_in_2014_01.jpg/1280px-Lung_Cu_flag_tower_of_Ha_Giang_in_2014_01.jpg";
    private static final String HG_DONG_VAN = "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e1/%C4%90%E1%BB%93ng_V%C4%83n%2C_Vietnam_-_1.jpg/1280px-%C4%90%E1%BB%93ng_V%C4%83n%2C_Vietnam_-_1.jpg";
    private static final String HG_THAM_MA = "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5e/Tham_Ma_pass_-_Dong_Van.jpg/1280px-Tham_Ma_pass_-_Dong_Van.jpg";

    private static final String MC_TEA_HILL = "https://upload.wikimedia.org/wikipedia/commons/7/71/Moc-chau-tea-doi-2094890_960_720.jpg";
    private static final String MC_DAI_YEM_1 = "https://upload.wikimedia.org/wikipedia/commons/e/e9/Thacdaiyem.jpg";
    private static final String MC_DAI_YEM_2 = "https://upload.wikimedia.org/wikipedia/commons/a/a8/Thacdaiyem1.jpg";
    private static final String MC_NHA_SAN = "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/67/Nha_san_Moc_Chau.jpg/1280px-Nha_san_Moc_Chau.jpg";
    private static final String MC_TOWN = "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Th%E1%BB%8B_tr%E1%BA%A5n_M%E1%BB%99c_Ch%C3%A2u%2C_S%C6%A1n_La.jpg/1280px-Th%E1%BB%8B_tr%E1%BA%A5n_M%E1%BB%99c_Ch%C3%A2u%2C_S%C6%A1n_La.jpg";

    private static final String NT_PANORAMA = "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/19/Panorama_of_V%E1%BB%8Bnh_Nha_Trang_coastline.jpg/1280px-Panorama_of_V%E1%BB%8Bnh_Nha_Trang_coastline.jpg";
    private static final String NT_PONAGAR = "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/af/Templo_Po_Nagar_07.jpg/1280px-Templo_Po_Nagar_07.jpg";
    private static final String NT_LONG_SON = "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/53/Nha_Trang%2C_Long_Son_pagoda.jpg/1280px-Nha_Trang%2C_Long_Son_pagoda.jpg";
    private static final String NT_HON_CHONG = "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e9/Hon_Chong_rocks_2011.jpg/1280px-Hon_Chong_rocks_2011.jpg";
    private static final String NT_HON_MUN = "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5a/Hon_Mun_island_%28H%C3%B2n_Mun%29%2C_Cam_Ranh%2C_Nha_Trang%2C_Vi%E1%BB%87t_Nam_20140518_105634_%28taken_with_Samsung_Galaxy_Note_3%29.jpg/1280px-Hon_Mun_island_%28H%C3%B2n_Mun%29%2C_Cam_Ranh%2C_Nha_Trang%2C_Vi%E1%BB%87t_Nam_20140518_105634_%28taken_with_Samsung_Galaxy_Note_3%29.jpg";
    private static final String NT_BEACH = "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Nha_Trang_Beach_10.jpg/1280px-Nha_Trang_Beach_10.jpg";

    private static final String QN_KY_CO = "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ab/Ky-Co-Beach%2C-Quy-Nhon%2C-Vietnam-1300px.jpg/1280px-Ky-Co-Beach%2C-Quy-Nhon%2C-Vietnam-1300px.jpg";
    private static final String QN_EO_GIO = "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/52/Eo_Gi%C3%B3_-_Nh%C6%A1n_L%C3%BD.jpg/1280px-Eo_Gi%C3%B3_-_Nh%C6%A1n_L%C3%BD.jpg";
    private static final String QN_THAP_DOI = "https://upload.wikimedia.org/wikipedia/commons/3/3a/Quy-Nhon-Thap-Doi-Cham-Towers.jpg";
    private static final String QN_QUEENS = "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3e/Queen%27s_beach%2C_Quy_Nhon_city%2C_Binh_Dinh_province%2C_Vietnam.jpg/1280px-Queen%27s_beach%2C_Quy_Nhon_city%2C_Binh_Dinh_province%2C_Vietnam.jpg";
    private static final String QN_VIEW = "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6a/View_of_Quy_Nhon.jpg/1280px-View_of_Quy_Nhon.jpg";
    private static final String QN_NHON_LY = "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/79/Nhon_Ly%2C_Quy_Nhon%2C_Vietnam_%2853001404016%29.jpg/1280px-Nhon_Ly%2C_Quy_Nhon%2C_Vietnam_%2853001404016%29.jpg";

    private static final String CD_SIX_SENSES = "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/6e/Beach_view_from_Six_Senses_Resort_in_C%C3%B4n_%C4%90%E1%BA%A3o_%28April_2022%29.jpg/1280px-Beach_view_from_Six_Senses_Resort_in_C%C3%B4n_%C4%90%E1%BA%A3o_%28April_2022%29.jpg";
    private static final String CD_PARK = "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3d/C%C3%B4n_%C4%90%E1%BA%A3o_National_Park.jpg/1280px-C%C3%B4n_%C4%90%E1%BA%A3o_National_Park.jpg";
    private static final String CD_BEACH = "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Pulo_Condore_island_beach.jpg/1280px-Pulo_Condore_island_beach.jpg";
    private static final String CD_MUI_CA_MAP = "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/M%C5%A9i_C%C3%A1_M%E1%BA%ADp_%28ph%C3%ADa_nh%C3%ACn_ra_H%C3%B2n_B%C3%A0%29_-_C%C3%B4n_%C4%90%E1%BA%A3o.jpg/1280px-M%C5%A9i_C%C3%A1_M%E1%BA%ADp_%28ph%C3%ADa_nh%C3%ACn_ra_H%C3%B2n_B%C3%A0%29_-_C%C3%B4n_%C4%90%E1%BA%A3o.jpg";
    private static final String CD_PRISON = "https://upload.wikimedia.org/wikipedia/commons/9/92/Con_Dao_prison%2C_Vietnam.JPG";
    private static final String CD_BAY = "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/91/C%C3%B4n_%C4%90%E1%BA%A3o%2C_B%C3%A0_R%E1%BB%8Ba_-_V%C5%A9ng_T%C3%A0u%2C_Vietnam_-_panoramio_%2810%29.jpg/1280px-C%C3%B4n_%C4%90%E1%BA%A3o%2C_B%C3%A0_R%E1%BB%8Ba_-_V%C5%A9ng_T%C3%A0u%2C_Vietnam_-_panoramio_%2810%29.jpg";

    // Ảnh bìa & địa danh từng vùng (12 vùng, mỗi vùng 10 ảnh)
    private static final Map<String, List<String>> REGION_GALLERIES = Map.ofEntries(
            Map.entry("ha-long", List.of(
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
            )),
            Map.entry("da-lat", List.of(
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
            )),
            Map.entry("hoi-an", List.of(
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
            )),
            Map.entry("sa-pa", List.of(
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
            )),
            Map.entry("phu-quoc", List.of(
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
            )),
            Map.entry("hue", List.of(
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
            )),
            Map.entry("ninh-binh", List.of(
                    NB_TRANG_AN, NB_TAM_COC, NB_HANG_MUA, NB_BAI_DINH, NB_HOA_LU, NB_PANORAMA,
                    IMG_LIMO, IMG_VIET_FOOD, IMG_RESORT_SPA, IMG_COFFEE
            )),
            Map.entry("ha-giang", List.of(
                    HG_MA_PI_LENG, HG_NHO_QUE, HG_TU_SAN, HG_LUNG_CU, HG_DONG_VAN, HG_THAM_MA,
                    IMG_LIMO, IMG_BBQ, IMG_VIET_FOOD, IMG_COFFEE
            )),
            Map.entry("moc-chau", List.of(
                    MC_TEA_HILL, MC_DAI_YEM_1, MC_DAI_YEM_2, MC_NHA_SAN, MC_TOWN,
                    IMG_LIMO, IMG_BBQ, IMG_VIET_FOOD, IMG_RESORT_SPA, IMG_COFFEE
            )),
            Map.entry("nha-trang", List.of(
                    NT_PANORAMA, NT_PONAGAR, NT_LONG_SON, NT_HON_CHONG, NT_HON_MUN, NT_BEACH,
                    IMG_LIMO, IMG_SEAFOOD, IMG_RESORT_SPA, IMG_COFFEE
            )),
            Map.entry("quy-nhon", List.of(
                    QN_KY_CO, QN_EO_GIO, QN_THAP_DOI, QN_QUEENS, QN_VIEW, QN_NHON_LY,
                    IMG_LIMO, IMG_SEAFOOD, IMG_RESORT_SPA, IMG_COFFEE
            )),
            Map.entry("con-dao", List.of(
                    CD_SIX_SENSES, CD_PARK, CD_BEACH, CD_MUI_CA_MAP, CD_PRISON, CD_BAY,
                    IMG_SEAFOOD, IMG_RESORT_SPA, IMG_VIET_FOOD, IMG_COFFEE
            ))
    );

    // Tổng 107 ảnh: 6 dùng chung + 66 vùng cũ + 35 vùng mới
    private static final List<PhotoSeed> PHOTO_CATALOG = List.of(
            // Shared activities (region == null)
            new PhotoSeed(null, IMG_LIMO, "Xe Limousine / Xe du lịch", "Xe du lịch đời mới đưa đón tận nơi trên các cung đường Việt Nam", "Di chuyển", "EurovisionNim", 1),
            new PhotoSeed(null, IMG_BBQ, "Tiệc BBQ nướng", "Bữa tiệc nướng BBQ thơm lừng hấp dẫn", "Ẩm thực", "HSeqao MLSGA", 2),
            new PhotoSeed(null, IMG_SEAFOOD, "Hải sản tươi sống", "Thưởng thức hải sản tươi ngon đánh bắt trong ngày", "Ẩm thực", "Phương Huy (thảo luận)", 3),
            new PhotoSeed(null, IMG_VIET_FOOD, "Ẩm thực Việt Nam", "Mâm cơm và các món ngon truyền thống Việt Nam", "Ẩm thực", "Guilhem Vellut from Paris, France", 4),
            new PhotoSeed(null, IMG_RESORT_SPA, "Khu nghỉ dưỡng & Spa", "Không gian hồ bơi và spa thư giãn tại khu nghỉ dưỡng Việt Nam", "Lưu trú", "Dennis G. Jarvis", 5),
            new PhotoSeed(null, IMG_COFFEE, "Cà phê & Bữa sáng Việt", "Bữa sáng nhẹ nhàng cùng ly cà phê Việt đậm đà hương vị", "Ẩm thực", "Amenoc", 6),

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
            new PhotoSeed("sa-pa", "/images/tours/sa-pa/11-sapa-hotpot-bbq.jpg", "Ẩm thực Tây Bắc Sa Pa", "Nồi lẩu nóng và đồ nướng đặc sản giữa tiết trời se lạnh Sa Pa", "Ẩm thực", "Mozzihh", 120),

            // Ninh Bình (6)
            new PhotoSeed("ninh-binh", NB_TRANG_AN, "Quần thể danh thắng Tràng An", "Ngồi thuyền nan len lỏi qua hệ thống hang động và núi đá vôi Tràng An", "Toàn cảnh", "Wikimedia Commons", 130),
            new PhotoSeed("ninh-binh", NB_TAM_COC, "Tam Cốc – Bích Động", "Dòng Ngô Đồng uốn lượn giữa cánh đồng lúa và dãy núi đá vôi Tam Cốc", "Trải nghiệm", "Wikimedia Commons", 131),
            new PhotoSeed("ninh-binh", NB_HANG_MUA, "Đỉnh Ngọa Long – Hang Múa", "Toàn cảnh thung lũng Tam Cốc nhìn từ đỉnh Ngọa Long ở Hang Múa", "Toàn cảnh", "Wikimedia Commons", 132),
            new PhotoSeed("ninh-binh", NB_BAI_DINH, "Chùa Bái Đính", "Quần thể chùa lớn bậc nhất Đông Nam Á tại Gia Viễn, Ninh Bình", "Trải nghiệm", "Wikimedia Commons", 133),
            new PhotoSeed("ninh-binh", NB_HOA_LU, "Cố đô Hoa Lư", "Di tích kinh đô nước Đại Cồ Việt thế kỷ X giữa núi non Hoa Lư", "Trải nghiệm", "Wikimedia Commons", 134),
            new PhotoSeed("ninh-binh", NB_PANORAMA, "Toàn cảnh non nước Ninh Bình", "Vẻ đẹp sơn thủy hữu tình đặc trưng của vùng đất cố đô Hoa Lư", "Toàn cảnh", "Wikimedia Commons", 135),

            // Hà Giang (6)
            new PhotoSeed("ha-giang", HG_MA_PI_LENG, "Đèo Mã Pí Lèng", "Cung đường Hạnh Phúc uốn lượn trên vách núi đá tai mèo Mã Pí Lèng", "Di chuyển", "Wikimedia Commons", 140),
            new PhotoSeed("ha-giang", HG_NHO_QUE, "Sông Nho Quế", "Dòng sông Nho Quế xanh ngọc bích chảy dưới chân đèo Mã Pí Lèng", "Toàn cảnh", "Wikimedia Commons", 141),
            new PhotoSeed("ha-giang", HG_TU_SAN, "Hẻm vực Tu Sản", "Hẻm vực sâu nhất Đông Nam Á với vách đá dựng đứng bên sông Nho Quế", "Trải nghiệm", "Wikimedia Commons", 142),
            new PhotoSeed("ha-giang", HG_LUNG_CU, "Cột cờ Lũng Cú", "Điểm cực Bắc thiêng liêng của Tổ quốc tại huyện Đồng Văn, Hà Giang", "Toàn cảnh", "Wikimedia Commons", 143),
            new PhotoSeed("ha-giang", HG_DONG_VAN, "Phố cổ Đồng Văn", "Những nếp nhà trình tường cổ kính giữa cao nguyên đá Đồng Văn", "Lưu trú", "Wikimedia Commons", 144),
            new PhotoSeed("ha-giang", HG_THAM_MA, "Dốc Thẩm Mã", "Con dốc chín khúc nổi tiếng trên hành trình khám phá cao nguyên đá", "Di chuyển", "Wikimedia Commons", 145),

            // Mộc Châu (5)
            new PhotoSeed("moc-chau", MC_TEA_HILL, "Đồi chè Trái Tim Mộc Châu", "Đồi chè xanh mướt trải dài trên cao nguyên Mộc Châu, Sơn La", "Toàn cảnh", "Wikimedia Commons", 150),
            new PhotoSeed("moc-chau", MC_DAI_YEM_1, "Thác Dải Yếm", "Dòng thác trắng xóa đổ xuống giữa núi rừng cao nguyên Mộc Châu", "Trải nghiệm", "Wikimedia Commons", 151),
            new PhotoSeed("moc-chau", MC_DAI_YEM_2, "Suối và tầng thác Dải Yếm", "Khung cảnh thiên nhiên mát lành quanh khu vực thác Dải Yếm", "Toàn cảnh", "Wikimedia Commons", 152),
            new PhotoSeed("moc-chau", MC_NHA_SAN, "Nhà sàn bản địa Mộc Châu", "Không gian homestay nhà sàn truyền thống của đồng bào Thái tại Mộc Châu", "Lưu trú", "Wikimedia Commons", 153),
            new PhotoSeed("moc-chau", MC_TOWN, "Cao nguyên Mộc Châu", "Thung lũng xanh mát và đồi núi trập trùng tại thị xã Mộc Châu", "Toàn cảnh", "Wikimedia Commons", 154),

            // Nha Trang (6)
            new PhotoSeed("nha-trang", NT_PANORAMA, "Vịnh Nha Trang", "Đường bờ biển cong mềm mại và làn nước xanh biếc của vịnh Nha Trang", "Toàn cảnh", "Wikimedia Commons", 160),
            new PhotoSeed("nha-trang", NT_PONAGAR, "Tháp Bà Ponagar", "Quần thể tháp Chăm cổ kính uy nghiêm bên cửa sông Cái Nha Trang", "Trải nghiệm", "Wikimedia Commons", 161),
            new PhotoSeed("nha-trang", NT_LONG_SON, "Chùa Long Sơn", "Ngôi cổ tự nổi tiếng với tượng Kim Thân Phật Tổ trên đồi Trại Thủy", "Trải nghiệm", "Wikimedia Commons", 162),
            new PhotoSeed("nha-trang", NT_HON_CHONG, "Danh thắng Hòn Chồng", "Bãi đá tự nhiên xếp chồng kỳ thú bên bờ biển phía Bắc Nha Trang", "Toàn cảnh", "Wikimedia Commons", 163),
            new PhotoSeed("nha-trang", NT_HON_MUN, "Đảo Hòn Mun", "Khu bảo tồn biển với rạn san hô rực rỡ bậc nhất vịnh Nha Trang", "Trải nghiệm", "Wikimedia Commons", 164),
            new PhotoSeed("nha-trang", NT_BEACH, "Bãi biển Trần Phú Nha Trang", "Bờ cát vàng nắng ấm và hàng dừa dọc đường biển Trần Phú", "Toàn cảnh", "Wikimedia Commons", 165),

            // Quy Nhơn (6)
            new PhotoSeed("quy-nhon", QN_KY_CO, "Bãi biển Kỳ Co", "Làn nước hai màu xanh ngọc trong vắt ôm lấy vách đá ở Kỳ Co, Nhơn Lý", "Toàn cảnh", "Wikimedia Commons", 170),
            new PhotoSeed("quy-nhon", QN_EO_GIO, "Eo Gió – Nhơn Lý", "Cung đường đi bộ ven vách đá hướng thẳng ra biển Đông tại Eo Gió", "Trải nghiệm", "Wikimedia Commons", 171),
            new PhotoSeed("quy-nhon", QN_THAP_DOI, "Tháp Đôi Quy Nhơn", "Cụm tháp Chăm cổ kiến trúc độc đáo giữa lòng thành phố Quy Nhơn", "Trải nghiệm", "Wikimedia Commons", 172),
            new PhotoSeed("quy-nhon", QN_QUEENS, "Bãi tắm Hoàng Hậu – Ghềnh Ráng", "Bãi đá trứng tròn độc đáo tại khu du lịch Ghềnh Ráng Tiên Sa", "Toàn cảnh", "Wikimedia Commons", 173),
            new PhotoSeed("quy-nhon", QN_VIEW, "Toàn cảnh vịnh Quy Nhơn", "Phố biển Quy Nhơn hiền hòa ôm lấy vịnh biển miền Trung", "Toàn cảnh", "Wikimedia Commons", 174),
            new PhotoSeed("quy-nhon", QN_NHON_LY, "Làng chài Nhơn Lý", "Làng chài ven biển bình yên với những con thuyền thúng ở Nhơn Lý", "Trải nghiệm", "Wikimedia Commons", 175),

            // Côn Đảo (6)
            new PhotoSeed("con-dao", CD_SIX_SENSES, "Bãi biển Côn Đảo", "Bờ cát trắng hoang sơ và làn nước trong xanh nhìn ra Hòn Bảy Cạnh", "Toàn cảnh", "Wikimedia Commons", 180),
            new PhotoSeed("con-dao", CD_PARK, "Vườn quốc gia Côn Đảo", "Hệ sinh thái rừng nguyên sinh và biển đảo được bảo tồn nghiêm ngặt", "Trải nghiệm", "Wikimedia Commons", 181),
            new PhotoSeed("con-dao", CD_BEACH, "Bãi Đầm Trầu", "Một trong những bãi biển đẹp nhất Côn Đảo bên rừng thông xanh mát", "Toàn cảnh", "Wikimedia Commons", 182),
            new PhotoSeed("con-dao", CD_MUI_CA_MAP, "Mũi Cá Mập – Hòn Bà", "Cung đường ven biển ngoạn mục nhìn sang Hòn Bà tại Côn Đảo", "Di chuyển", "Wikimedia Commons", 183),
            new PhotoSeed("con-dao", CD_PRISON, "Di tích Nhà tù Côn Đảo", "Khu di tích lịch sử đặc biệt gắn liền với trang sử hào hùng dân tộc", "Trải nghiệm", "Wikimedia Commons", 184),
            new PhotoSeed("con-dao", CD_BAY, "Vịnh Côn Sơn", "Toàn cảnh vịnh Côn Sơn thanh bình nhìn từ sườn núi ven biển", "Toàn cảnh", "Wikimedia Commons", 185)
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
        seedGuideApplications();
        syncRealMediaAndPhotos();
    }

    private void migrateColumns() {
        List<String> ddlStatements = List.of(
                "ALTER TABLE tours ALTER COLUMN gallery_images NVARCHAR(4000)",
                "ALTER TABLE tours ALTER COLUMN gallery_images VARCHAR(4000)",
                "ALTER TABLE tours ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE",
                "ALTER TABLE app_users ALTER COLUMN role NVARCHAR(20)",
                "ALTER TABLE app_users ALTER COLUMN role VARCHAR(20)",
                "ALTER TABLE app_users ADD COLUMN IF NOT EXISTS demo_account BOOLEAN DEFAULT FALSE",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS lock_version BIGINT DEFAULT 0",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS guide_accepted BOOLEAN DEFAULT FALSE",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS adults INTEGER",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS children INTEGER",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_percent INTEGER DEFAULT 30",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_amount BIGINT",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS deposit_paid BOOLEAN DEFAULT FALSE",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_reason VARCHAR(500)",
                "ALTER TABLE bookings ADD COLUMN IF NOT EXISTS confirmed_snapshot_json VARCHAR(8000)"
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

        // ===== 6 Guide mẫu đầu tiên (demoAccount = true, giữ nguyên cho chọn nhanh) =====
        AppUser binh = user("Trần Văn Bình", Role.GUIDE, "binh.guide@tripbuilder.vn", "0912 345 678",
                AVATAR_BINH, "Hướng dẫn viên bản địa Vịnh Hạ Long & Quảng Ninh (8 năm kinh nghiệm).", 8, r.get("ha-long"));
        AppUser minh = user("Nguyễn Quang Minh", Role.GUIDE, "minh.guide@tripbuilder.vn", "0914 555 666",
                AVATAR_BINH, "Hướng dẫn viên bản địa Sa Pa & Hoàng Liên Sơn (7 năm kinh nghiệm trekking).", 7, r.get("sa-pa"));
        AppUser chi = user("Lê Thị Chi", Role.GUIDE, "chi.guide@tripbuilder.vn", "0987 654 321",
                AVATAR_CHI, "Người Đà Lạt gốc, chuyên thiết kế tour nghỉ dưỡng gia đình & săn mây.", 5, r.get("da-lat"));
        AppUser nam = user("Võ Hoàng Nam", Role.GUIDE, "nam.guide@tripbuilder.vn", "0939 777 888",
                AVATAR_DUNG, "Thổ địa đảo ngọc Phú Quốc, chuyên tour cano 4 đảo & nghỉ dưỡng biển.", 6, r.get("phu-quoc"));
        AppUser dung = user("Phạm Minh Dũng", Role.GUIDE, "dung.guide@tripbuilder.vn", "0905 111 222",
                AVATAR_DUNG, "Thuyết minh viên di sản phố cổ Hội An & làng nghề Quảng Nam.", 6, r.get("hoi-an"));
        AppUser thao = user("Tôn Nữ Phương Thảo", Role.GUIDE, "thao.guide@tripbuilder.vn", "0905 999 111",
                AVATAR_CHI, "Thuyết minh viên di sản Cố đô Huế, am hiểu ẩm thực cung đình & nhã nhạc.", 6, r.get("hue"));

        // ===== 6 Guide bổ sung cho 6 vùng cũ (mỗi vùng đủ 2 Guide) =====
        AppUser tuan = extraUser("Ngô Đức Tuấn", Role.GUIDE, "tuan.guide@tripbuilder.vn", "0913 201 101",
                AVATAR_DUNG, "Thổ địa Hạ Long & Bái Tử Long, chuyên tuyến du thuyền nghỉ đêm và chèo kayak.", 6, r.get("ha-long"));
        AppUser linh = extraUser("Hoàng Khánh Linh", Role.GUIDE, "linh.guide@tripbuilder.vn", "0913 202 102",
                AVATAR_CHI, "Hướng dẫn viên bản địa Đà Lạt, chuyên trải nghiệm nông trại, cà phê và trekking rừng thông.", 4, r.get("da-lat"));
        AppUser haGuide = extraUser("Nguyễn Thu Hà", Role.GUIDE, "ha.guide@tripbuilder.vn", "0913 203 103",
                AVATAR_HOA, "Hướng dẫn viên Hội An – Cù Lao Chàm, am hiểu làng gốm Thanh Hà và ẩm thực phố cổ.", 5, r.get("hoi-an"));
        AppUser phong = extraUser("Lý A Phong", Role.GUIDE, "phong.guide@tripbuilder.vn", "0913 204 104",
                AVATAR_BINH, "Hướng dẫn viên người H'Mông bản địa Sa Pa, chuyên cung trekking ruộng bậc thang Tả Van.", 9, r.get("sa-pa"));
        AppUser hai = extraUser("Trương Văn Hải", Role.GUIDE, "hai.guide@tripbuilder.vn", "0913 205 105",
                AVATAR_DUNG, "Thổ địa Bắc đảo Phú Quốc, chuyên lặn san hô Rạch Vẹm và tour gia đình.", 5, r.get("phu-quoc"));
        AppUser quang = extraUser("Hồ Nhật Quang", Role.GUIDE, "quang.guide@tripbuilder.vn", "0913 206 106",
                AVATAR_BINH, "Hướng dẫn viên di sản Huế & đầm phá Tam Giang – Lăng Cô.", 7, r.get("hue"));

        // ===== 12 Guide cho 6 vùng mới (2 Guide / vùng) =====
        AppUser hieu = extraUser("Đinh Trung Hiếu", Role.GUIDE, "hieu.guide@tripbuilder.vn", "0913 207 107",
                AVATAR_BINH, "Thổ địa Tràng An – Tam Cốc, 7 năm dẫn tour sinh thái và di sản Ninh Bình.", 7, r.get("ninh-binh"));
        AppUser ngoc = extraUser("Vũ Bích Ngọc", Role.GUIDE, "ngoc.guide@tripbuilder.vn", "0913 208 108",
                AVATAR_CHI, "Hướng dẫn viên Ninh Bình, chuyên tuyến Hoa Lư – Bái Đính – Hang Múa và ẩm thực dê núi.", 5, r.get("ninh-binh"));

        AppUser son = extraUser("Giàng Mí Sơn", Role.GUIDE, "son.guide@tripbuilder.vn", "0913 209 109",
                AVATAR_DUNG, "Thổ địa cao nguyên đá Đồng Văn – Hà Giang, thông thạo cung đèo Mã Pí Lèng & sông Nho Quế.", 8, r.get("ha-giang"));
        AppUser trang = extraUser("Nguyễn Minh Trang", Role.GUIDE, "trang.guide@tripbuilder.vn", "0913 210 110",
                AVATAR_CHI, "Hướng dẫn viên chuyên tuyến Hà Giang – Hoàng Su Phì và văn hoá chợ phiên vùng cao.", 5, r.get("ha-giang"));

        AppUser cuong = extraUser("Lò Văn Cường", Role.GUIDE, "cuong.guide@tripbuilder.vn", "0913 211 111",
                AVATAR_BINH, "Người Thái bản địa Mộc Châu, chuyên săn mây Tà Xùa, đồi chè và trải nghiệm bản Áng.", 6, r.get("moc-chau"));
        AppUser maiGuide = extraUser("Phạm Tuyết Mai", Role.GUIDE, "mai.guide@tripbuilder.vn", "0913 212 112",
                AVATAR_HOA, "Hướng dẫn viên Mộc Châu, am hiểu mùa hoa mận, thác Dải Yếm và homestay sinh thái.", 4, r.get("moc-chau"));

        AppUser dat = extraUser("Lê Thành Đạt", Role.GUIDE, "dat.guide@tripbuilder.vn", "0913 213 113",
                AVATAR_DUNG, "Thổ địa vịnh Nha Trang, chuyên tour đảo Hòn Mun, lặn biển và ẩm thực hải sản Khánh Hoà.", 7, r.get("nha-trang"));
        AppUser vy = extraUser("Trần Khánh Vy", Role.GUIDE, "vy.guide@tripbuilder.vn", "0913 214 114",
                AVATAR_CHI, "Hướng dẫn viên Nha Trang – Cam Ranh, chuyên tour nghỉ dưỡng gia đình và văn hoá Tháp Bà.", 5, r.get("nha-trang"));

        AppUser hungGuide = extraUser("Võ Quốc Hưng", Role.GUIDE, "hung.guide@tripbuilder.vn", "0913 215 115",
                AVATAR_BINH, "Thổ địa Bình Định, 6 năm dẫn tour Kỳ Co – Eo Gió – Cù Lao Xanh tại Quy Nhơn.", 6, r.get("quy-nhon"));
        AppUser yen = extraUser("Huỳnh Hải Yến", Role.GUIDE, "yen.guide@tripbuilder.vn", "0913 216 116",
                AVATAR_HOA, "Hướng dẫn viên Quy Nhơn, am hiểu tháp Chăm cổ, Ghềnh Ráng và đặc sản xứ Nẫu.", 4, r.get("quy-nhon"));

        AppUser kiet = extraUser("Nguyễn Tuấn Kiệt", Role.GUIDE, "kiet.guide@tripbuilder.vn", "0913 217 117",
                AVATAR_DUNG, "Thổ địa Côn Đảo, chuyên tour sinh thái Vườn quốc gia, Bãi Đầm Trầu và lặn ngắm san hô.", 7, r.get("con-dao"));
        AppUser lan = extraUser("Lê Phương Lan", Role.GUIDE, "lan.guide@tripbuilder.vn", "0913 218 118",
                AVATAR_CHI, "Hướng dẫn viên di tích lịch sử Côn Đảo và nghỉ dưỡng cao cấp tại vịnh Côn Sơn.", 6, r.get("con-dao"));

        // ===== 3 Khách hàng mẫu (demoAccount = true) + 9 Khách hàng bổ sung (tổng 12 khách) =====
        AppUser an = user("Nguyễn Văn An", Role.CUSTOMER, "an.nguyen@gmail.com", "0901 234 567", AVATAR_AN, null, null, null);
        AppUser hoa = user("Đỗ Thu Hoa", Role.CUSTOMER, "hoa.do@gmail.com", "0934 567 890", AVATAR_HOA, null, null, null);
        AppUser khoa = user("Hoàng Minh Khoa", Role.CUSTOMER, "khoa.hoang@gmail.com", "0978 222 333", AVATAR_KHOA, null, null, null);

        AppUser phuong = extraUser("Trần Lan Phương", Role.CUSTOMER, "phuong.tran@gmail.com", "0902 311 101", AVATAR_HOA, null, null, null);
        AppUser duc = extraUser("Phạm Anh Đức", Role.CUSTOMER, "duc.pham@gmail.com", "0902 311 102", AVATAR_AN, null, null, null);
        AppUser thu = extraUser("Nguyễn Minh Thư", Role.CUSTOMER, "thu.nguyen@gmail.com", "0902 311 103", AVATAR_KHOA, null, null, null);
        AppUser longCust = extraUser("Bùi Hoàng Long", Role.CUSTOMER, "long.bui@gmail.com", "0902 311 104", AVATAR_BINH, null, null, null);
        AppUser nhung = extraUser("Lê Hồng Nhung", Role.CUSTOMER, "nhung.le@gmail.com", "0902 311 105", AVATAR_CHI, null, null, null);
        AppUser huy = extraUser("Đặng Quang Huy", Role.CUSTOMER, "huy.dang@gmail.com", "0902 311 106", AVATAR_DUNG, null, null, null);
        AppUser tram = extraUser("Võ Bảo Trâm", Role.CUSTOMER, "tram.vo@gmail.com", "0902 311 107", AVATAR_HOA, null, null, null);
        AppUser khang = extraUser("Trịnh Gia Khang", Role.CUSTOMER, "khang.trinh@gmail.com", "0902 311 108", AVATAR_AN, null, null, null);
        AppUser yenCust = extraUser("Đoàn Hải Yến", Role.CUSTOMER, "yen.doan@gmail.com", "0902 311 109", AVATAR_KHOA, null, null, null);

        // ===== 6 Tour Preset đầu tiên (GIỮ NGUYÊN THỨ TỰ & NỘI DUNG) =====
        Long tHaLong = seedTour(binh,
                "Hạ Long 2N1Đ — Vịnh đá vôi & Chèo Kayak",
                "Xe Limousine đón tận nơi, nghỉ khách sạn hướng vịnh, chèo Kayak hang Luồn và hải sản bản địa.",
                "/images/tours/ha-long/01-bay-panorama.jpg",
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe Limousine Hà Nội – Hạ Long & Guide đón", 400_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Khách sạn Mường Thanh 4★ hướng vịnh", 700_000, "/images/tours/ha-long/09-bay-view-hotel.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Tàu thăm vịnh & Chèo Kayak hang Luồn", 500_000, "/images/tours/ha-long/05-kayak-luon-cave.jpg"),
                        new TourStepRequest(1, "Ăn uống", "Set hải sản Hạ Long ven biển", 400_000, "/images/tours/ha-long/10-ha-long-seafood.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Cáp treo Nữ Hoàng & Đồi Mặt Trời", 400_000, "/images/tours/ha-long/08-bai-chay-cable-car.jpg"),
                        new TourStepRequest(2, "Di chuyển", "Ăn trưa chả mực & Xe về Hà Nội", 400_000, "/images/tours/ha-long/11-cha-muc-ha-long.jpg")
                ));

        seedTour(minh,
                "Sa Pa 3N2Đ — Bản Cát Cát & Đỉnh Fansipan",
                "Trekking bản H'Mông, săn mây đỉnh Fansipan và thưởng thức lẩu cá hồi suối lạnh.",
                "/images/tours/sa-pa/01-muong-hoa-terraces.jpg",
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Limousine Hà Nội – Sa Pa & Guide đón", 500_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Homestay gỗ thung lũng Mường Hoa (2 đêm)", 800_000, "/images/tours/sa-pa/08-muong-hoa-homestay.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Trekking bản Cát Cát & Thác Tiên Sa", 300_000, "/images/tours/sa-pa/04-cat-cat-village.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Cáp treo khứ hồi đỉnh Fansipan", 900_000, "/images/tours/sa-pa/03-fansipan-cable-car.jpg"),
                        new TourStepRequest(2, "Ăn uống", "Tiệc tối lẩu cá hồi & đồ nướng", 400_000, "/images/tours/sa-pa/11-sapa-hotpot-bbq.jpg"),
                        new TourStepRequest(3, "Di chuyển", "Chợ phiên Sa Pa & Xe về Hà Nội", 500_000, "/images/tours/sa-pa/07-sapa-market.jpg")
                ));

        Long tDaLat = seedTour(chi,
                "Đà Lạt 3N2Đ — Săn mây Cầu Đất & Đồi thông",
                "Đón bình minh biển mây, hái dâu tại vườn và thưởng thức lẩu gà lá é giữa rừng thông.",
                "/images/tours/da-lat/01-cau-dat-tea-hill.jpg",
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đón sân bay Liên Khương", 300_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Homestay Đồi Thông (2 đêm)", 800_000, "/images/tours/da-lat/09-pine-hill-homestay.jpg"),
                        new TourStepRequest(1, "Ăn uống", "Lẩu gà lá é & dạo chợ đêm", 250_000, "/images/tours/da-lat/07-dalat-night-market.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Xe Jeep săn mây Cầu Đất lúc 5h", 450_000, "/images/tours/da-lat/01-cau-dat-tea-hill.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Vườn dâu & Thung lũng Tình Yêu", 300_000, "/images/tours/da-lat/06-valley-of-love.jpg"),
                        new TourStepRequest(3, "Di chuyển", "Cà phê Mê Linh & Tiễn sân bay", 300_000, "/images/tours/da-lat/10-dalat-coffee.jpg")
                ));

        Long tPhuQuoc = seedTour(nam,
                "Phú Quốc 3N2Đ — Cano 4 Đảo & San hô",
                "Nghỉ resort ven biển Bãi Trường, cano 4 đảo phía Nam và hải sản chợ đêm Dinh Cậu.",
                "/images/tours/phu-quoc/01-sao-beach.jpg",
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Đón sân bay & Làng chài Hàm Ninh", 300_000, "/images/tours/phu-quoc/06-ham-ninh-pier.jpg"),
                        new TourStepRequest(1, "Khách sạn", "Resort 4★ Sol by Meliá (2 đêm)", 1_800_000, "/images/tours/phu-quoc/07-phu-quoc-resort.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Cano 4 đảo & Lặn ngắm san hô", 800_000, "/images/tours/phu-quoc/04-coral-snorkeling.jpg"),
                        new TourStepRequest(2, "Ăn uống", "Hải sản chợ đêm Dinh Cậu", 500_000, "/images/tours/phu-quoc/08-night-market-seafood.jpg"),
                        new TourStepRequest(3, "Di chuyển", "Hoàng hôn Sunset Sanato & Tiễn bay", 300_000, "/images/tours/phu-quoc/11-west-coast-sunset.jpg")
                ));

        Long tHoiAn = seedTour(dung,
                "Hội An 2N1Đ — Đèn lồng & Rừng dừa Bảy Mẫu",
                "Thả hoa đăng sông Hoài, thuyền thúng rừng dừa Bảy Mẫu và thưởng thức Cao lầu phố cổ.",
                "/images/tours/hoi-an/01-ancient-town-lanterns.jpg",
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe đón Đà Nẵng – Hội An", 300_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Hội An Riverside Villa ven sông", 600_000, "/images/tours/hoi-an/09-riverside-villa.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Phố cổ & Thả đèn hoa đăng", 300_000, "/images/tours/hoi-an/03-lantern-street-night.jpg"),
                        new TourStepRequest(1, "Ăn uống", "Cao lầu, Cơm gà & Bánh mì Phượng", 250_000, "/images/tours/hoi-an/10-cao-lau-hoi-an.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Thuyền thúng Rừng dừa & Nấu ăn", 550_000, "/images/tours/hoi-an/05-bay-mau-basket-boat.jpg")
                ));

        Long tHue = seedTour(thao,
                "Cố đô Huế 2N1Đ — Đại Nội & Ca Huế sông Hương",
                "Khám phá di sản triều Nguyễn cùng thuyết minh viên bản địa, ca Huế thuyền rồng và cơm Vua.",
                "/images/tours/hue/01-ngo-mon-gate.jpg",
                2,
                List.of(
                        new TourStepRequest(1, "Khách sạn", "Saigon Morin 4★ bên sông Hương", 700_000, "/images/tours/hue/09-hue-heritage-hotel.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Đại Nội & Lăng Tự Đức – Khải Định", 450_000, "/images/tours/hue/02-thai-hoa-palace.jpg"),
                        new TourStepRequest(1, "Ăn uống", "Cơm cung đình & Ca Huế sông Hương", 450_000, "/images/tours/hue/06-perfume-river-dragon-boat.jpg"),
                        new TourStepRequest(2, "Di chuyển", "Đầm Lập An & Tiễn sân bay", 300_000, "/images/tours/hue/08-lap-an-lagoon.jpg")
                ));

        // ===== 38 Tour mở rộng phủ đều 24 Guide & 12 vùng (Tổng 44 Tour) =====
        // 1) Hạ Long (binh +1, tuan +2)
        Long tHaLong2 = seedTour(binh,
                "Hạ Long 3N2Đ — Du thuyền 5★ & Làng chài Cửa Vạn",
                "Nghỉ đêm du thuyền giữa vịnh, thăm Hang Sửng Sốt, đảo Ti Tốp và làng chài nổi Cửa Vạn.",
                "/images/tours/ha-long/04-cruise-bay.jpg",
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe Limousine Hà Nội – Tuần Châu", 400_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Du thuyền Paradise 5★ (2 đêm)", 2_400_000, "/images/tours/ha-long/04-cruise-bay.jpg"),
                        new TourStepRequest(1, "Ăn uống", "Buffet hải sản trên boong tàu", 650_000, "/images/tours/ha-long/10-ha-long-seafood.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Hang Sửng Sốt & Đỉnh đảo Ti Tốp", 550_000, "/images/tours/ha-long/02-titop-island.jpg"),
                        new TourStepRequest(3, "Trải nghiệm", "Thăm làng chài Cửa Vạn & Chèo nan", 400_000, "/images/tours/ha-long/07-cua-van-village.jpg")
                ));
        Long tHaLong3 = seedTour(tuan,
                "Hạ Long 2N1Đ — Tắm khoáng Yoko Onsen & Hòn Trống Mái",
                "Kết hợp ngoạn cảnh vịnh đá vôi buổi sáng và thư giãn khoáng nóng chuẩn Nhật tại Quang Hanh.",
                "/images/tours/ha-long/03-trong-mai-islet.jpg",
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đưa đón tuyến Hạ Long", 450_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Vinpearl Resort & Spa Hạ Long 5★", 1_600_000, IMG_RESORT_SPA),
                        new TourStepRequest(1, "Trải nghiệm", "Tàu thăm Hòn Trống Mái & Động Thiên Cung", 450_000, "/images/tours/ha-long/06-sung-sot-cave.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Tắm khoáng nóng Yoko Onsen Quang Hanh", 900_000, IMG_RESORT_SPA),
                        new TourStepRequest(2, "Ăn uống", "Bún bề bề & Chả mực Hạ Long", 300_000, "/images/tours/ha-long/11-cha-muc-ha-long.jpg")
                ));
        seedTour(tuan,
                "Vịnh Bái Tử Long 2N1Đ — Hoang sơ & Hải sản làng chài",
                "Khám phá tuyến vịnh tĩnh lặng ít đông đúc, chèo kayak xuyên hang và BBQ hải sản tối.",
                "/images/tours/ha-long/02-titop-island.jpg",
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe Limousine đón Hà Nội – Hòn Gai", 400_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Khách sạn hướng vịnh Bãi Cháy 4★", 750_000, "/images/tours/ha-long/09-bay-view-hotel.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Chèo kayak vịnh Bái Tử Long", 500_000, "/images/tours/ha-long/05-kayak-luon-cave.jpg"),
                        new TourStepRequest(2, "Ăn uống", "Tiệc hải sản tươi sống làng chài", 550_000, IMG_SEAFOOD)
                ));

        // 2) Sa Pa (minh +1, phong +2)
        seedTour(minh,
                "Sa Pa 2N1Đ — Thác Bạc, Đèo Ô Quy Hồ & Nhà thờ đá",
                "Hành trình ngắn ngày săn hoàng hôn cổng trời Ô Quy Hồ và dạo chợ đêm Sa Pa.",
                "/images/tours/sa-pa/10-o-quy-ho-pass.jpg",
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Limousine Hà Nội – Sa Pa khứ hồi", 500_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Khách sạn trung tâm Sa Pa 4★", 700_000, "/images/tours/sa-pa/09-sapa-town-hotel.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Thác Bạc & Săn mây đèo Ô Quy Hồ", 350_000, "/images/tours/sa-pa/05-silver-waterfall.jpg"),
                        new TourStepRequest(2, "Ăn uống", "Lẩu cá tầm & Thịt lợn cắp nách nướng", 400_000, "/images/tours/sa-pa/11-sapa-hotpot-bbq.jpg")
                ));
        Long tSapa3 = seedTour(phong,
                "Sa Pa 3N2Đ — Trekking Tả Van & Homestay bản địa",
                "Đi bộ xuyên thung lũng Mường Hoa, ngủ nhà sàn người Giáy và tắm lá thuốc Dao đỏ.",
                "/images/tours/sa-pa/08-muong-hoa-homestay.jpg",
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe cabin đôi Hà Nội – Sa Pa", 550_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Homestay bản Tả Van view ruộng bậc thang (2 đêm)", 750_000, "/images/tours/sa-pa/08-muong-hoa-homestay.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Trekking Lao Chải – Tả Van cùng Guide H'Mông", 450_000, "/images/tours/sa-pa/01-muong-hoa-terraces.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Tắm lá thuốc Dao đỏ & Dệt lanh thổ cẩm", 350_000, "/images/tours/sa-pa/04-cat-cat-village.jpg"),
                        new TourStepRequest(3, "Ăn uống", "Mâm cơm bản địa Tây Bắc", 300_000, IMG_VIET_FOOD)
                ));
        seedTour(phong,
                "Sa Pa 4N3Đ — Chợ phiên Bắc Hà & Đỉnh Fansipan",
                "Kết hợp săn mây nóc nhà Đông Dương và trải nghiệm sắc màu chợ phiên vùng cao.",
                "/images/tours/sa-pa/02-fansipan-summit.jpg",
                4,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Limousine đón Hà Nội – Lào Cai", 550_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Hotel de la Coupole 5★ / Boutique (3 đêm)", 1_800_000, "/images/tours/sa-pa/09-sapa-town-hotel.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Cáp treo Fansipan & Chinh phục đỉnh 3.143m", 950_000, "/images/tours/sa-pa/02-fansipan-summit.jpg"),
                        new TourStepRequest(3, "Trải nghiệm", "Chợ phiên vùng cao & Dinh Hoàng A Tưởng", 500_000, "/images/tours/sa-pa/07-sapa-market.jpg"),
                        new TourStepRequest(4, "Ăn uống", "Thắng cố, lẩu cá hồi & rượu ngô", 400_000, "/images/tours/sa-pa/11-sapa-hotpot-bbq.jpg")
                ));

        // 3) Đà Lạt (chi +1, linh +2) — không lặp từ "Cầu Đất" để giữ nguyên filter test
        seedTour(chi,
                "Đà Lạt 2N1Đ — Biệt thự Pháp cổ & Hồ Tuyền Lâm",
                "Chuyến nghỉ dưỡng nhẹ nhàng: chèo SUP hồ Tuyền Lâm, thăm ga cổ và cà phê phố núi.",
                "/images/tours/da-lat/02-tuyen-lam-lake.jpg",
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đón sân bay Liên Khương", 300_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Biệt thự Ana Mandara Villas 5★", 1_400_000, "/images/tours/da-lat/08-french-villa-dalat.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Chèo SUP hồ Tuyền Lâm & Thiền viện Trúc Lâm", 450_000, "/images/tours/da-lat/02-tuyen-lam-lake.jpg"),
                        new TourStepRequest(2, "Ăn uống", "Cà phê sáng & Bánh căn Đà Lạt", 250_000, "/images/tours/da-lat/10-dalat-coffee.jpg")
                ));
        Long tDaLat3 = seedTour(linh,
                "Đà Lạt 3N2Đ — Thác Datanla, Ga cổ & BBQ Đồi thông",
                "Trải nghiệm máng trượt xuyên rừng thông, check-in ga xe lửa cổ và tiệc nướng sân vườn.",
                "/images/tours/da-lat/04-datanla-waterfall.jpg",
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe 7 chỗ phục vụ theo lịch trình", 400_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Villa đồi thông Làng Hoa (2 đêm)", 900_000, "/images/tours/da-lat/09-pine-hill-homestay.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Ga Đà Lạt cổ & Hồ Xuân Hương hoàng hôn", 250_000, "/images/tours/da-lat/05-dalat-railway-station.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Máng trượt thác Datanla & Đồi Robin", 400_000, "/images/tours/da-lat/04-datanla-waterfall.jpg"),
                        new TourStepRequest(2, "Ăn uống", "Tiệc nướng BBQ sân vườn giữa rừng thông", 350_000, IMG_BBQ),
                        new TourStepRequest(3, "Ăn uống", "Cà phê rang xay & Mua đặc sản", 200_000, "/images/tours/da-lat/10-dalat-coffee.jpg")
                ));
        seedTour(linh,
                "Đà Lạt 4N3Đ — Nông trại xanh & Đêm nhạc Acoustic",
                "Khám phá nông trại hữu cơ, vườn hoa thành phố và thưởng thức đêm nhạc acoustic ấm cúng.",
                "/images/tours/da-lat/06-valley-of-love.jpg",
                4,
                List.of(
                        new TourStepRequest(1, "Khách sạn", "Resort ven hồ Tuyền Lâm (3 đêm)", 1_800_000, "/images/tours/da-lat/03-xuan-huong-lake.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Tour nông trại dâu tây & Vườn hoa", 350_000, "/images/tours/da-lat/06-valley-of-love.jpg"),
                        new TourStepRequest(3, "Ăn uống", "Bánh tráng nướng chợ đêm & Sữa đậu nành", 250_000, "/images/tours/da-lat/11-dalat-bbq-hotpot.jpg"),
                        new TourStepRequest(4, "Di chuyển", "Tiễn sân bay Liên Khương", 300_000, IMG_LIMO)
                ));

        // 4) Phú Quốc (nam +1, hai +2)
        seedTour(nam,
                "Phú Quốc 4N3Đ — Hòn Thơm, Bãi Sao & Resort 5★",
                "Trọn vẹn đảo ngọc: cáp treo vượt biển Hòn Thơm, lặn san hô và nghỉ dưỡng Bãi Khem.",
                "/images/tours/phu-quoc/02-hon-thom-cable-car.jpg",
                4,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đón sân bay Phú Quốc", 300_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Resort 5★ Bãi Khem / Bãi Trường (3 đêm)", 2_900_000, IMG_RESORT_SPA),
                        new TourStepRequest(2, "Trải nghiệm", "Cáp treo Hòn Thơm & Công viên nước Aquatopia", 750_000, "/images/tours/phu-quoc/02-hon-thom-cable-car.jpg"),
                        new TourStepRequest(3, "Trải nghiệm", "Tắm biển Bãi Sao & Ngắm hoàng hôn Dinh Cậu", 350_000, "/images/tours/phu-quoc/05-dinh-cau-sunset.jpg"),
                        new TourStepRequest(4, "Ăn uống", "Gỏi cá trích & Hải sản Hàm Ninh", 500_000, "/images/tours/phu-quoc/08-night-market-seafood.jpg")
                ));
        Long tPhuQuoc3 = seedTour(hai,
                "Bắc đảo Phú Quốc 3N2Đ — Rạch Vẹm & Bãi Dài hoang sơ",
                "Khám phá mũi Gành Dầu, làng chài Rạch Vẹm sao biển và thưởng thức hải sản tươi sống.",
                "/images/tours/phu-quoc/09-bai-dai-ganh-dau.jpg",
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đón tiễn sân bay & Bắc đảo", 400_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Bungalow ven biển Bãi Dài (2 đêm)", 1_400_000, "/images/tours/phu-quoc/07-phu-quoc-resort.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Mũi Gành Dầu & Bãi sao biển Rạch Vẹm", 450_000, "/images/tours/phu-quoc/09-bai-dai-ganh-dau.jpg"),
                        new TourStepRequest(2, "Ăn uống", "BBQ hải sản hoàng hôn biển Tây", 600_000, IMG_SEAFOOD),
                        new TourStepRequest(3, "Trải nghiệm", "Tham quan vườn tiêu & Nhà thùng nước mắm", 250_000, "/images/tours/phu-quoc/10-duong-dong-estuary.jpg")
                ));
        seedTour(hai,
                "Phú Quốc 2N1Đ — Lặn san hô An Thới & Chợ đêm",
                "Lịch trình cuối tuần gọn nhẹ: cano ra quần đảo An Thới, câu cá và ăn tối chợ đêm.",
                "/images/tours/phu-quoc/03-an-thoi-archipelago.jpg",
                2,
                List.of(
                        new TourStepRequest(1, "Khách sạn", "Resort 4★ Dương Đông (1 đêm)", 900_000, "/images/tours/phu-quoc/07-phu-quoc-resort.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Cano quần đảo An Thới & Lặn san hô", 750_000, "/images/tours/phu-quoc/04-coral-snorkeling.jpg"),
                        new TourStepRequest(2, "Ăn uống", "Bún quậy Kiến Xây & Hải sản chợ đêm", 400_000, "/images/tours/phu-quoc/08-night-market-seafood.jpg")
                ));

        // 5) Hội An (dung +1, haGuide +2)
        seedTour(dung,
                "Hội An 3N2Đ — Ký ức Hội An, Trà Quế & Biển An Bàng",
                "Sống chậm phố cổ: đạp xe làng rau Trà Quế, tắm biển An Bàng và xem show Ký ức Hội An.",
                "/images/tours/hoi-an/02-japanese-covered-bridge.jpg",
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đón sân bay Đà Nẵng", 300_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Victoria Hội An Beach Resort 4★ (2 đêm)", 1_400_000, "/images/tours/hoi-an/08-an-bang-beach.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Chùa Cầu, Hội quán Phúc Kiến & Phố tường vàng", 300_000, "/images/tours/hoi-an/07-fujian-assembly-hall.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Show thực cảnh Ký Ức Hội An", 600_000, "/images/tours/hoi-an/01-ancient-town-lanterns.jpg"),
                        new TourStepRequest(3, "Ăn uống", "Lớp nấu ăn làng rau Trà Quế & Bánh mì Hội An", 450_000, "/images/tours/hoi-an/11-banh-mi-hoi-an.jpg")
                ));
        Long tHoiAn3 = seedTour(haGuide,
                "Hội An 2N1Đ — Làng gốm Thanh Hà & Hoàng hôn Thu Bồn",
                "Tự tay nặn gốm truyền thống bên sông Thu Bồn, dạo phố đèn lồng và thưởng thức Cao lầu.",
                "/images/tours/hoi-an/06-thu-bon-river-sunset.jpg",
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe đưa đón Đà Nẵng – Hội An", 300_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Villa phố cổ sân vườn (1 đêm)", 650_000, "/images/tours/hoi-an/09-riverside-villa.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Làng gốm Thanh Hà & Thuyền hoàng hôn Thu Bồn", 450_000, "/images/tours/hoi-an/06-thu-bon-river-sunset.jpg"),
                        new TourStepRequest(2, "Ăn uống", "Cơm gà Bà Buội & Cao lầu phố cổ", 250_000, "/images/tours/hoi-an/10-cao-lau-hoi-an.jpg")
                ));
        seedTour(haGuide,
                "Cù Lao Chàm – Hội An 3N2Đ — Biển đảo & Di sản",
                "Cano cao tốc ra Cù Lao Chàm lặn ngắm san hô ngày 1, tối về dạo phố cổ Hội An.",
                "/images/tours/hoi-an/08-an-bang-beach.jpg",
                3,
                List.of(
                        new TourStepRequest(1, "Khách sạn", "Boutique Hotel ven biển An Bàng (2 đêm)", 1_100_000, "/images/tours/hoi-an/08-an-bang-beach.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Cano Cù Lao Chàm & Lặn ngắm san hô", 650_000, IMG_SEAFOOD),
                        new TourStepRequest(2, "Trải nghiệm", "Phố đèn lồng & Tự tay làm đèn lồng lụa", 350_000, "/images/tours/hoi-an/03-lantern-street-night.jpg"),
                        new TourStepRequest(3, "Ăn uống", "Mì Quảng & Hải sản Cửa Đại", 350_000, IMG_VIET_FOOD)
                ));

        // 6) Huế (thao +1, quang +2)
        seedTour(thao,
                "Cố đô Huế 3N2Đ — Lăng tẩm triều Nguyễn & Chùa Thiên Mụ",
                "Hành trình chiều sâu qua Ngọ Môn, Điện Thái Hòa, Lăng Minh Mạng – Tự Đức – Khải Định.",
                "/images/tours/hue/03-thien-mu-pagoda.jpg",
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đón sân bay Phú Bài", 300_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Pilgrimage Village Resort 5★ (2 đêm)", 1_500_000, IMG_RESORT_SPA),
                        new TourStepRequest(1, "Trải nghiệm", "Chùa Thiên Mụ & Thuyền rồng sông Hương", 400_000, "/images/tours/hue/03-thien-mu-pagoda.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Đại Nội – Điện Thái Hòa – Lăng Minh Mạng", 500_000, "/images/tours/hue/11-minh-mang-tomb.jpg"),
                        new TourStepRequest(3, "Ăn uống", "Bún bò Huế, bánh bèo nậm lọc & cà phê muối", 300_000, "/images/tours/hue/10-bun-bo-hue.jpg")
                ));
        Long tHue3 = seedTour(quang,
                "Huế – Lăng Cô 3N2Đ — Đầm Lập An & Cầu Trường Tiền",
                "Kết hợp khám phá di sản cố đô và nghỉ dưỡng biển xanh vịnh Lăng Cô – đầm Lập An.",
                "/images/tours/hue/08-lap-an-lagoon.jpg",
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe 7 chỗ đưa đón Huế – Lăng Cô", 450_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Resort vịnh Lăng Cô (2 đêm)", 1_300_000, "/images/tours/hue/09-hue-heritage-hotel.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Đầm Lập An & Hải sản hàu nướng phô mai", 450_000, "/images/tours/hue/08-lap-an-lagoon.jpg"),
                        new TourStepRequest(2, "Trải nghiệm", "Lăng Khải Định & Ngắm hoàng hôn cầu Trường Tiền", 400_000, "/images/tours/hue/07-truong-tien-bridge.jpg"),
                        new TourStepRequest(3, "Ăn uống", "Cơm hến & Chè hẻm cố đô", 250_000, IMG_VIET_FOOD)
                ));
        seedTour(quang,
                "Huế 2N1Đ — Rừng ngập mặn Rú Chá & Phá Tam Giang",
                "Đón bình minh trên phá Tam Giang, chèo SUP rừng ngập mặn và ăn hải sản đầm phá.",
                "/images/tours/hue/07-truong-tien-bridge.jpg",
                2,
                List.of(
                        new TourStepRequest(1, "Khách sạn", "Khách sạn boutique trung tâm Huế (1 đêm)", 650_000, "/images/tours/hue/09-hue-heritage-hotel.jpg"),
                        new TourStepRequest(1, "Trải nghiệm", "Hoàng hôn phá Tam Giang & Rừng Rú Chá", 400_000, "/images/tours/hue/06-perfume-river-dragon-boat.jpg"),
                        new TourStepRequest(2, "Ăn uống", "Bánh khoái cá kình & Bún bò Huế", 300_000, "/images/tours/hue/10-bun-bo-hue.jpg")
                ));

        // 7) Ninh Bình (hieu x2, ngoc x2)
        Long tNinhBinh1 = seedTour(hieu,
                "Ninh Bình 2N1Đ — Tràng An, Hang Múa & Cố đô Hoa Lư",
                "Chèo đò xuyên hang Tràng An, leo 486 bậc Hang Múa ngắm toàn cảnh Tam Cốc và thăm Hoa Lư.",
                NB_TRANG_AN,
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe Limousine Hà Nội – Ninh Bình", 350_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Bungalow giữa cánh đồng Tam Cốc (1 đêm)", 750_000, NB_PANORAMA),
                        new TourStepRequest(1, "Trải nghiệm", "Thuyền nan danh thắng Tràng An", 400_000, NB_TRANG_AN),
                        new TourStepRequest(2, "Trải nghiệm", "Leo đỉnh Ngọa Long – Hang Múa & Cố đô Hoa Lư", 350_000, NB_HANG_MUA),
                        new TourStepRequest(2, "Ăn uống", "Đặc sản dê núi & cơm cháy Ninh Bình", 300_000, IMG_VIET_FOOD)
                ));
        seedTour(hieu,
                "Ninh Bình 3N2Đ — Tam Cốc, Vườn chim Thung Nham & Cúc Phương",
                "Hành trình sinh thái trọn vẹn: đạp xe xuyên Tam Cốc, ngắm chim về tổ và trekking rừng Cúc Phương.",
                NB_TAM_COC,
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đưa đón theo tuyến Ninh Bình", 450_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Emeralda Resort Ninh Bình 4★ (2 đêm)", 1_500_000, IMG_RESORT_SPA),
                        new TourStepRequest(1, "Trải nghiệm", "Đò Tam Cốc – Bích Động & Đạp xe làng quê", 400_000, NB_TAM_COC),
                        new TourStepRequest(2, "Trải nghiệm", "Vườn quốc gia Cúc Phương & Thung Nham", 450_000, NB_PANORAMA),
                        new TourStepRequest(3, "Ăn uống", "Gỏi cá nhệch Kim Sơn & Dê tái chanh", 350_000, IMG_VIET_FOOD)
                ));
        Long tNinhBinh3 = seedTour(ngoc,
                "Ninh Bình 2N1Đ — Chùa Bái Đính & Đầm Vân Long",
                "Chiêm bái quần thể chùa Bái Đính hùng vĩ và xuôi thuyền đầm Vân Long tĩnh lặng.",
                NB_BAI_DINH,
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe Limousine Hà Nội – Gia Viễn", 350_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Resort ven đầm Vân Long 4★ (1 đêm)", 900_000, IMG_RESORT_SPA),
                        new TourStepRequest(1, "Trải nghiệm", "Tham quan chùa Bái Đính bằng xe điện", 400_000, NB_BAI_DINH),
                        new TourStepRequest(2, "Trải nghiệm", "Thuyền nan khu bảo tồn đầm Vân Long", 300_000, NB_HOA_LU)
                ));
        seedTour(ngoc,
                "Ninh Bình 1 ngày — Hoa Lư, Tam Cốc & Hoàng hôn Hang Múa",
                "Lịch trình gọn trong ngày từ Hà Nội cùng Guide bản địa am hiểu lịch sử triều Đinh – Tiền Lê.",
                NB_HANG_MUA,
                1,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Limousine đón trả tại phố cổ Hà Nội", 350_000, IMG_LIMO),
                        new TourStepRequest(1, "Trải nghiệm", "Cố đô Hoa Lư & Chèo đò Tam Cốc", 450_000, NB_HOA_LU),
                        new TourStepRequest(1, "Ăn uống", "Bữa trưa đặc sản dê núi Trường Yên", 250_000, IMG_VIET_FOOD),
                        new TourStepRequest(1, "Trải nghiệm", "Ngắm hoàng hôn trên đỉnh Hang Múa", 200_000, NB_HANG_MUA)
                ));

        // 8) Hà Giang (son x2, trang x2)
        Long tHaGiang1 = seedTour(son,
                "Hà Giang 3N2Đ — Đèo Mã Pí Lèng & Sông Nho Quế",
                "Chinh phục tứ đại đỉnh đèo Mã Pí Lèng, đi thuyền hẻm vực Tu Sản và ngủ phố cổ Đồng Văn.",
                HG_MA_PI_LENG,
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe giường nằm cabin + Xe máy/Ô tô bản địa", 750_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Homestay nhà trình tường Đồng Văn (2 đêm)", 700_000, HG_DONG_VAN),
                        new TourStepRequest(2, "Trải nghiệm", "Đèo Mã Pí Lèng & Thuyền sông Nho Quế – Hẻm Tu Sản", 550_000, HG_NHO_QUE),
                        new TourStepRequest(2, "Trải nghiệm", "Cột cờ Lũng Cú & Dốc Thẩm Mã", 350_000, HG_LUNG_CU),
                        new TourStepRequest(3, "Ăn uống", "Lẩu gà đen & Bánh cuốn Đồng Văn", 350_000, IMG_BBQ)
                ));
        seedTour(son,
                "Hà Giang 4N3Đ — Cung đường Hạnh Phúc & Du Già",
                "Trọn vòng Hà Giang Loop cùng thổ địa người Mông: Quản Bạ – Yên Minh – Đồng Văn – Mèo Vạc – Du Già.",
                HG_TU_SAN,
                4,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe SUV 7 chỗ chuyên đường đèo núi", 1_100_000, HG_THAM_MA),
                        new TourStepRequest(1, "Khách sạn", "H'Mông Village & Homestay Du Già (3 đêm)", 1_200_000, HG_DONG_VAN),
                        new TourStepRequest(2, "Trải nghiệm", "Hẻm Tu Sản & Sông Nho Quế", 500_000, HG_TU_SAN),
                        new TourStepRequest(3, "Trải nghiệm", "Tắm thác Du Già & Làng dệt Lùng Tám", 400_000, HG_MA_PI_LENG),
                        new TourStepRequest(4, "Ăn uống", "Mèn mén, thắng dền & BBQ bản địa", 400_000, IMG_BBQ)
                ));
        Long tHaGiang3 = seedTour(trang,
                "Hà Giang 3N2Đ — Hoàng Su Phì mùa lúa & Chợ phiên",
                "Săn mây Chiêu Lầu Thi, ngắm ruộng bậc thang Bản Phùng và giao lưu văn hoá chợ phiên.",
                HG_LUNG_CU,
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Limousine Hà Nội – Hà Giang khứ hồi", 650_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Eco Lodge Bản Phùng (2 đêm)", 900_000, HG_DONG_VAN),
                        new TourStepRequest(2, "Trải nghiệm", "Trekking ruộng bậc thang Hoàng Su Phì", 450_000, HG_THAM_MA),
                        new TourStepRequest(3, "Ăn uống", "Cá chép ruộng & Thịt trâu gác bếp", 350_000, IMG_VIET_FOOD)
                ));
        seedTour(trang,
                "Hà Giang 2N1Đ — Quản Bạ, Yên Minh & Phố cổ Đồng Văn",
                "Chuyến đi cuối tuần ngắm Núi Đôi Cô Tiên, Dốc Thẩm Mã và thưởng thức cà phê Phố Cổ.",
                HG_DONG_VAN,
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe du lịch 16 chỗ từ Hà Nội", 600_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Khách sạn trung tâm Đồng Văn (1 đêm)", 500_000, HG_DONG_VAN),
                        new TourStepRequest(2, "Trải nghiệm", "Cổng trời Quản Bạ & Dinh thự họ Vương", 400_000, HG_LUNG_CU)
                ));

        // 9) Mộc Châu (cuong x2, maiGuide x2)
        Long tMocChau1 = seedTour(cuong,
                "Mộc Châu 2N1Đ — Đồi chè Trái Tim & Thác Dải Yếm",
                "Đón bình minh trên đồi chè xanh mướt, dạo thác Dải Yếm và nghỉ homestay nhà sàn người Thái.",
                MC_TEA_HILL,
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Limousine Hà Nội – Mộc Châu", 400_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Homestay nhà sàn bản Áng (1 đêm)", 550_000, MC_NHA_SAN),
                        new TourStepRequest(1, "Trải nghiệm", "Đồi chè Trái Tim & Thung lũng mận Nà Ka", 300_000, MC_TEA_HILL),
                        new TourStepRequest(2, "Trải nghiệm", "Thác Dải Yếm & Cầu kính Bạch Long", 450_000, MC_DAI_YEM_1),
                        new TourStepRequest(2, "Ăn uống", "Bê chao Mộc Châu & Cá suối nướng", 300_000, IMG_BBQ)
                ));
        seedTour(cuong,
                "Mộc Châu 3N2Đ — Săn mây Tà Xùa & Rừng thông Bản Áng",
                "Kết hợp săn biển mây sống lưng khủng long Tà Xùa và nghỉ dưỡng cao nguyên Mộc Châu.",
                MC_TOWN,
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng Hà Nội – Tà Xùa – Mộc Châu", 650_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Glamping đồi chè & Nhà sàn (2 đêm)", 900_000, MC_NHA_SAN),
                        new TourStepRequest(2, "Trải nghiệm", "Săn mây sống lưng khủng long Tà Xùa", 450_000, MC_TOWN),
                        new TourStepRequest(3, "Ăn uống", "Lẩu cá hồi Chiềng Đi & Sữa tươi nông trường", 350_000, IMG_VIET_FOOD)
                ));
        Long tMocChau3 = seedTour(maiGuide,
                "Mộc Châu 2N1Đ — Mùa hoa mận, Trang trại bò sữa & Hang Dơi",
                "Check-in vườn hoa mận trắng muốt, trải nghiệm vắt sữa bò tươi và đốt lửa trại tối.",
                MC_DAI_YEM_2,
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe du lịch đón tận nơi Hà Nội", 400_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Resort Thảo Nguyên Mộc Châu (1 đêm)", 850_000, IMG_RESORT_SPA),
                        new TourStepRequest(1, "Trải nghiệm", "Thác Dải Yếm & Đồi chè Tân Lập", 350_000, MC_DAI_YEM_2),
                        new TourStepRequest(2, "Ăn uống", "Tiệc nướng BBQ bản địa & Cơm lam", 300_000, IMG_BBQ)
                ));
        seedTour(maiGuide,
                "Mộc Châu 2N1Đ — Nghỉ dưỡng cuối tuần & Cà phê đồi chè",
                "Lịch trình thư giãn nhẹ nhàng cho cặp đôi và gia đình nhỏ giữa khí hậu mát mẻ quanh năm.",
                MC_NHA_SAN,
                2,
                List.of(
                        new TourStepRequest(1, "Khách sạn", "Bungalow gỗ giữa rừng thông (1 đêm)", 800_000, MC_NHA_SAN),
                        new TourStepRequest(1, "Trải nghiệm", "Đồi chè Trái Tim & Rừng thông bản Áng", 300_000, MC_TEA_HILL),
                        new TourStepRequest(2, "Ăn uống", "Bữa sáng cà phê đồi & Bê chao", 300_000, IMG_COFFEE)
                ));

        // 10) Nha Trang (dat x2, vy x2)
        Long tNhaTrang1 = seedTour(dat,
                "Nha Trang 3N2Đ — Lặn san hô Hòn Mun & Vịnh biển xanh",
                "Cano khám phá vịnh Nha Trang, lặn biển Hòn Mun và thưởng thức hải sản tươi sống.",
                NT_PANORAMA,
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đón sân bay Cam Ranh", 300_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Khách sạn mặt biển Trần Phú 4★ (2 đêm)", 1_200_000, NT_BEACH),
                        new TourStepRequest(2, "Trải nghiệm", "Cano 3 đảo & Lặn ngắm san hô Hòn Mun", 750_000, NT_HON_MUN),
                        new TourStepRequest(2, "Ăn uống", "Hải sản bờ kè tháp Bà & Nem nướng Ninh Hoà", 450_000, IMG_SEAFOOD),
                        new TourStepRequest(3, "Trải nghiệm", "Tháp Bà Ponagar & Tắm bùn khoáng I-Resort", 450_000, NT_PONAGAR)
                ));
        seedTour(dat,
                "Nha Trang 4N3Đ — VinWonders, Vịnh Ninh Vân & Đảo Điệp Sơn",
                "Hành trình kết hợp vui chơi công viên giải trí trên đảo và nghỉ dưỡng vịnh Ninh Vân.",
                NT_HON_MUN,
                4,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe đưa đón sân bay Cam Ranh khứ hồi", 350_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Resort 5★ Hòn Tre / Bãi Dài (3 đêm)", 2_700_000, IMG_RESORT_SPA),
                        new TourStepRequest(2, "Trải nghiệm", "Cáp treo & Trọn ngày vui chơi VinWonders", 950_000, NT_PANORAMA),
                        new TourStepRequest(3, "Trải nghiệm", "Du thuyền ngắm hoàng hôn vịnh Nha Trang", 650_000, NT_BEACH),
                        new TourStepRequest(4, "Ăn uống", "Bún sứa, bánh căn mực & Hải sản", 400_000, IMG_SEAFOOD)
                ));
        Long tNhaTrang3 = seedTour(vy,
                "Nha Trang 2N1Đ — Tháp Bà Ponagar, Chùa Long Sơn & Hòn Chồng",
                "Khám phá di sản Chăm Pa cổ kính, ngắm toàn cảnh phố biển từ chùa Long Sơn và cà phê Hòn Chồng.",
                NT_PONAGAR,
                2,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đưa đón trung tâm Nha Trang", 300_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Boutique Hotel gần biển Trần Phú (1 đêm)", 700_000, NT_BEACH),
                        new TourStepRequest(1, "Trải nghiệm", "Tháp Bà Ponagar & Chùa Long Sơn", 300_000, NT_LONG_SON),
                        new TourStepRequest(2, "Trải nghiệm", "Danh thắng Hòn Chồng & Viện Hải dương học", 300_000, NT_HON_CHONG)
                ));
        seedTour(vy,
                "Cam Ranh – Nha Trang 3N2Đ — Bãi Dài & Tắm bùn khoáng",
                "Chuyến đi thư giãn dành cho gia đình: tắm biển Bãi Dài, tắm bùn khoáng nóng và thưởng thức yến sào.",
                NT_BEACH,
                3,
                List.of(
                        new TourStepRequest(1, "Khách sạn", "Resort 5★ Bãi Dài Cam Ranh (2 đêm)", 2_200_000, IMG_RESORT_SPA),
                        new TourStepRequest(2, "Trải nghiệm", "Tắm bùn khoáng nóng & Spa thư giãn", 550_000, IMG_RESORT_SPA),
                        new TourStepRequest(3, "Ăn uống", "Hải sản đầm Thủy Triều & Bún chả cá", 450_000, IMG_SEAFOOD)
                ));

        // 11) Quy Nhơn (hungGuide x2, yen x2)
        Long tQuyNhon1 = seedTour(hungGuide,
                "Quy Nhơn 3N2Đ — Kỳ Co, Eo Gió & Làng chài Nhơn Lý",
                "Khám phá thiên đường biển Kỳ Co nước trong vắt, đi bộ Eo Gió và ăn hải sản Nhơn Lý.",
                QN_KY_CO,
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đón sân bay Phù Cát", 300_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Khách sạn ven biển Quy Nhơn 4★ (2 đêm)", 1_100_000, QN_VIEW),
                        new TourStepRequest(2, "Trải nghiệm", "Cano Kỳ Co – Bãi Dứa lặn san hô & Eo Gió", 650_000, QN_EO_GIO),
                        new TourStepRequest(2, "Ăn uống", "Hải sản Nhơn Lý & Bánh xèo tôm nhảy", 400_000, IMG_SEAFOOD),
                        new TourStepRequest(3, "Trải nghiệm", "Đồi cát Phương Mai & Tháp Đôi Quy Nhơn", 250_000, QN_THAP_DOI)
                ));
        seedTour(hungGuide,
                "Quy Nhơn 2N1Đ — Đảo Cù Lao Xanh & Vịnh Quy Nhơn",
                "Cano ra đảo Cù Lao Xanh ngắm hải đăng trăm tuổi, lặn san hô và BBQ tối trên bãi biển.",
                QN_EO_GIO,
                2,
                List.of(
                        new TourStepRequest(1, "Khách sạn", "Homestay biển Cù Lao Xanh / Quy Nhơn (1 đêm)", 650_000, QN_NHON_LY),
                        new TourStepRequest(1, "Trải nghiệm", "Cano đảo Cù Lao Xanh & Hải đăng Plogam Bir", 600_000, QN_KY_CO),
                        new TourStepRequest(2, "Ăn uống", "Mực nháy nướng & Bánh hỏi lòng heo", 350_000, IMG_SEAFOOD)
                ));
        Long tQuyNhon3 = seedTour(yen,
                "Quy Nhơn – Phú Yên 3N2Đ — Ghềnh Ráng, Tháp Đôi & Gành Đá Đĩa",
                "Kết nối hai tỉnh duyên hải: Ghềnh Ráng Tiên Sa, Tháp Đôi Chăm Pa và Gành Đá Đĩa.",
                QN_THAP_DOI,
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng theo tuyến Quy Nhơn – Phú Yên", 550_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Resort Ghềnh Ráng 4★ (2 đêm)", 1_300_000, IMG_RESORT_SPA),
                        new TourStepRequest(2, "Trải nghiệm", "Bãi tắm Hoàng Hậu & Tháp Đôi Quy Nhơn", 300_000, QN_QUEENS),
                        new TourStepRequest(3, "Trải nghiệm", "Gành Đá Đĩa & Đầm Ô Loan ăn sò huyết", 450_000, IMG_SEAFOOD)
                ));
        seedTour(yen,
                "Quy Nhơn 2N1Đ — Văn hoá Chăm Pa & Ẩm thực xứ Nẫu",
                "Tham quan Tháp Bánh Ít, Tháp Đôi, làng võ cổ truyền Tây Sơn và thưởng thức đặc sản Bình Định.",
                QN_QUEENS,
                2,
                List.of(
                        new TourStepRequest(1, "Khách sạn", "Khách sạn trung tâm phố biển (1 đêm)", 700_000, QN_VIEW),
                        new TourStepRequest(1, "Trải nghiệm", "Tháp Đôi & Bảo tàng Quang Trung Tây Sơn", 350_000, QN_THAP_DOI),
                        new TourStepRequest(2, "Ăn uống", "Bún chả cá Quy Nhơn & Nem chợ Huyện", 250_000, IMG_VIET_FOOD)
                ));

        // 12) Côn Đảo (kiet x2, lan x2)
        Long tConDao1 = seedTour(kiet,
                "Côn Đảo 3N2Đ — Bãi Đầm Trầu, Hòn Bảy Cạnh & Vườn Quốc Gia",
                "Hành trình thiên nhiên nguyên sơ: trekking rừng Ông Đụng, lặn san hô Hòn Bảy Cạnh và ngắm hoàng hôn Bãi Nhát.",
                CD_BEACH,
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe đón sân bay Cỏ Ống & Tham quan Mũi Cá Mập", 400_000, CD_MUI_CA_MAP),
                        new TourStepRequest(1, "Khách sạn", "Resort ven biển Côn Sơn 4★ (2 đêm)", 1_900_000, CD_SIX_SENSES),
                        new TourStepRequest(2, "Trải nghiệm", "Cano Hòn Bảy Cạnh & Vườn quốc gia Côn Đảo", 850_000, CD_PARK),
                        new TourStepRequest(2, "Ăn uống", "Ốc vú nàng, cua mặt trăng & hải sản Côn Đảo", 550_000, IMG_SEAFOOD),
                        new TourStepRequest(3, "Trải nghiệm", "Tắm biển Bãi Đầm Trầu ngắm máy bay hạ cánh", 300_000, CD_BEACH)
                ));
        seedTour(kiet,
                "Côn Đảo 2N1Đ — Sinh thái biển & Đỉnh Tình Yêu",
                "Chuyến đi cuối tuần: chèo kayak vịnh Côn Sơn, lặn ngắm san hô và thưởng thức hải sản tươi.",
                CD_MUI_CA_MAP,
                2,
                List.of(
                        new TourStepRequest(1, "Khách sạn", "Boutique Hotel trung tâm Côn Đảo (1 đêm)", 950_000, CD_BAY),
                        new TourStepRequest(1, "Trải nghiệm", "Lặn san hô Hòn Tài & Chèo kayak vịnh Côn Sơn", 650_000, CD_PARK),
                        new TourStepRequest(2, "Ăn uống", "Bún riêu cua & Hải sản cảng Bến Đầm", 400_000, IMG_SEAFOOD)
                ));
        Long tConDao3 = seedTour(lan,
                "Côn Đảo 3N2Đ — Hành trình tri ân & Nghỉ dưỡng vịnh Côn Sơn",
                "Viếng Nghĩa trang Hàng Dương, Bảo tàng Côn Đảo, Dinh Chúa Đảo và thư giãn bên bãi biển hoang sơ.",
                CD_PRISON,
                3,
                List.of(
                        new TourStepRequest(1, "Di chuyển", "Xe riêng đưa đón sân bay & Nội đảo", 400_000, IMG_LIMO),
                        new TourStepRequest(1, "Khách sạn", "Orson Resort & Spa Côn Đảo (2 đêm)", 2_200_000, CD_SIX_SENSES),
                        new TourStepRequest(1, "Trải nghiệm", "Di tích Nhà tù Côn Đảo & Cầu tàu 914", 350_000, CD_PRISON),
                        new TourStepRequest(2, "Trải nghiệm", "Viếng Nghĩa trang Hàng Dương & Miếu Bà Phi Yến", 350_000, CD_BAY),
                        new TourStepRequest(3, "Ăn uống", "Cơm Việt & Đặc sản hạt bàng Côn Đảo", 350_000, IMG_VIET_FOOD)
                ));
        seedTour(lan,
                "Côn Đảo 4N3Đ — Nghỉ dưỡng cao cấp & Khám phá 4 hòn đảo",
                "Trải nghiệm nghỉ dưỡng biệt lập bên vịnh biển ngọc, du thuyền riêng và spa thư giãn.",
                CD_SIX_SENSES,
                4,
                List.of(
                        new TourStepRequest(1, "Khách sạn", "Villa hướng biển Côn Đảo 5★ (3 đêm)", 4_200_000, CD_SIX_SENSES),
                        new TourStepRequest(2, "Trải nghiệm", "Thăm Di tích lịch sử & Bảo tàng Côn Đảo", 400_000, CD_PRISON),
                        new TourStepRequest(3, "Trải nghiệm", "Thuê tàu riêng tham quan Hòn Cau – Hòn Trứng", 1_100_000, CD_BEACH),
                        new TourStepRequest(4, "Ăn uống", "Tiệc tối hải sản riêng bên bờ biển", 700_000, IMG_SEAFOOD)
                ));

        // ===== 4 Booking đầu tiên (GIỮ NGUYÊN ID 1..4 ĐỂ ĐẢM BẢO TESTS) =====
        LocalDate today = LocalDate.now();

        // #1: WAITING_REQUOTE
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

        // #2: REQUOTED
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

        // #3: BOOKED_ORIGINAL
        bookingService.create(new CreateBookingRequest(
                tHoiAn, khoa.getId(), today.plusDays(25), 2, 2, "REMOTE",
                "Nhờ anh Dũng đặt giữ villa ven sông và bàn Cao lầu tối Ngày 1.",
                false, null
        ));

        // #4: COMPLETED + Review (thuộc an.nguyen@gmail.com — giữ nguyên ID 4)
        Long b4 = bookingService.create(new CreateBookingRequest(
                tPhuQuoc, an.getId(), today.plusDays(15), 3, 2, "COMPANION",
                "Giữ nguyên lịch trình chuẩn Phú Quốc.",
                false, null
        )).id();
        bookingService.accept(b4);
        bookingService.confirm(b4);
        bookingService.complete(b4);
        bookingService.review(b4, new ReviewRequest(
                5,
                "Guide Võ Hoàng Nam đặt trước cano và bàn hải sản view hoàng hôn rất chu đáo!"
        ));
        shiftBookingStartDate(b4, today.minusDays(10));

        // ===== 24 Booking bổ sung phủ đủ mọi BookingStatus + 10 Review =====
        // (Lưu ý: KHÔNG seed review cho tour của minh.guide và KHÔNG đặt lịch cho thao.guide vào plusDays(38..45))

        // #5..#8: BOOKED_ORIGINAL
        bookingService.create(new CreateBookingRequest(
                tNinhBinh1, phuong.getId(), today.plusDays(12), 2, 3, "COMPANION",
                "Đi cùng bố mẹ nên nhờ Guide hỗ trợ chọn thuyền có mái che ở Tràng An.",
                false, null
        ));
        bookingService.create(new CreateBookingRequest(
                tHaGiang1, duc.getId(), today.plusDays(18), 3, 4, "COMPANION",
                "Nhóm bạn 4 người thích chụp ảnh bình minh đèo Mã Pí Lèng.",
                false, null
        ));
        bookingService.create(new CreateBookingRequest(
                tNhaTrang1, thu.getId(), today.plusDays(22), 3, 2, "REMOTE",
                "Nhờ Guide đặt vé cano Hòn Mun và gợi ý quán nem nướng ngon.",
                false, null
        ));
        bookingService.create(new CreateBookingRequest(
                tHue, longCust.getId(), today.plusDays(10), 2, 2, "COMPANION",
                "Giữ nguyên lịch trình chuẩn, đón tại sân bay Phú Bài lúc 9h sáng.",
                false, null
        ));

        // #9..#12: WAITING_REQUOTE
        Long b9 = bookingService.create(new CreateBookingRequest(
                tMocChau1, nhung.getId(), today.plusDays(16), 2, 4, "COMPANION",
                "Nhóm muốn thêm phần đốt lửa trại tối ở bản Áng.",
                false, null
        )).id();
        customizeAddStep(b9, nhung, 1, "Yêu cầu thêm", "Đốt lửa trại & Giao lưu múa xòe tối Ngày 1", IMG_BBQ, "Thêm lửa trại buổi tối.");

        Long b10 = bookingService.create(new CreateBookingRequest(
                tQuyNhon1, huy.getId(), today.plusDays(24), 3, 3, "REMOTE",
                "Muốn nâng cấp khách sạn mặt biển 5 sao và thêm bữa tối hải sản.",
                false, null
        )).id();
        customizeAddStep(b10, huy, 2, "Yêu cầu thêm", "Set tôm hùm nướng bơ tỏi tại Nhơn Lý", IMG_SEAFOOD, "Bổ sung món tôm hùm.");

        Long b11 = bookingService.create(new CreateBookingRequest(
                tConDao1, tram.getId(), today.plusDays(28), 3, 2, "COMPANION",
                "Nhờ Guide đặt thêm vé xem rùa đẻ trứng ban đêm ở Hòn Bảy Cạnh nếu đúng mùa.",
                false, null
        )).id();
        customizeAddStep(b11, tram, 2, "Yêu cầu thêm", "Trải nghiệm ngắm rùa biển đêm tại Hòn Bảy Cạnh", CD_PARK, "Nhờ báo giá tour đêm.");

        Long b12 = bookingService.create(new CreateBookingRequest(
                tSapa3, khang.getId(), today.plusDays(19), 3, 5, "COMPANION",
                "Đoàn 5 người cần xe riêng đón từ ga Lào Cai.",
                false, null
        )).id();
        customizeAddStep(b12, khang, 1, "Di chuyển", "Thuê xe 7 chỗ riêng đón ga Lào Cai – Tả Van", IMG_LIMO, "Đổi sang xe 7 chỗ riêng.");

        // #13..#15: REQUOTED
        Long b13 = bookingService.create(new CreateBookingRequest(
                tNinhBinh3, yenCust.getId(), today.plusDays(14), 2, 2, "REMOTE",
                "Muốn thuê thêm xe đạp đôi quanh đầm Vân Long.",
                false, null
        )).id();
        var b13Custom = customizeAddStep(b13, yenCust, 2, "Yêu cầu thêm", "Thuê xe đạp đôi dạo quanh đầm Vân Long", NB_PANORAMA, "Thêm xe đạp buổi sáng.");
        requoteWithCustomPrice(b13, b13Custom.steps(), 150_000L, -100_000L, "Đã cập nhật giá thuê xe đạp đôi và giảm 100.000đ cho khách đặt sớm.");

        Long b14 = bookingService.create(new CreateBookingRequest(
                tHaLong2, phuong.getId(), today.plusDays(27), 3, 4, "COMPANION",
                "Muốn bổ sung tiệc rượu vang hoàng hôn trên boong du thuyền.",
                false, null
        )).id();
        var b14Custom = customizeAddStep(b14, phuong, 1, "Yêu cầu thêm", "Tiệc trà chiều & Rượu vang trên boong tàu", "/images/tours/ha-long/04-cruise-bay.jpg", "Báo giá thêm gói sunset.");
        requoteWithCustomPrice(b14, b14Custom.steps(), 300_000L, -200_000L, "Đã báo giá gói sunset 300.000đ/khách và ưu đãi nhóm 4 khách 200.000đ.");

        Long b15 = bookingService.create(new CreateBookingRequest(
                tConDao3, duc.getId(), today.plusDays(31), 3, 2, "COMPANION",
                "Nhờ Guide chuẩn bị lễ viếng Nghĩa trang Hàng Dương buổi tối.",
                false, null
        )).id();
        var b15Custom = customizeAddStep(b15, duc, 2, "Yêu cầu thêm", "Chuẩn bị lễ hoa tươi viếng Nghĩa trang Hàng Dương", CD_BAY, "Nhờ Guide chuẩn bị chu đáo.");
        requoteWithCustomPrice(b15, b15Custom.steps(), 250_000L, 0L, "Mình đã báo chi phí hoa lễ 250.000đ/khách và sắp xếp xe đưa đón tối.");

        // #16..#19: CONFIRMED
        Long b16 = bookingService.create(new CreateBookingRequest(
                tNhaTrang3, thu.getId(), today.plusDays(8), 2, 2, "COMPANION",
                "Đã thống nhất lịch tham quan Tháp Bà & Chùa Long Sơn.",
                false, null
        )).id();
        bookingService.accept(b16);
        bookingService.confirm(b16);

        Long b17 = bookingService.create(new CreateBookingRequest(
                tDaLat3, longCust.getId(), today.plusDays(11), 3, 3, "COMPANION",
                "Chốt lịch trình săn mây & BBQ đồi thông.",
                false, null
        )).id();
        bookingService.accept(b17);
        bookingService.confirm(b17);

        Long b18 = bookingService.create(new CreateBookingRequest(
                tQuyNhon3, nhung.getId(), today.plusDays(17), 3, 4, "REMOTE",
                "Gia đình 4 người tự túc vé máy bay, nhờ Guide giữ phòng và xe.",
                false, null
        )).id();
        bookingService.accept(b18);
        bookingService.confirm(b18);

        Long b19 = bookingService.create(new CreateBookingRequest(
                tHoiAn3, huy.getId(), today.plusDays(21), 2, 2, "COMPANION",
                "Chốt lịch làng gốm Thanh Hà & thuyền Thu Bồn.",
                false, null
        )).id();
        bookingService.accept(b19);
        bookingService.confirm(b19);

        // #20..#21: CHANGE_REQUESTED (xin điều chỉnh sau khi đã chốt)
        Long b20 = bookingService.create(new CreateBookingRequest(
                tMocChau3, tram.getId(), today.plusDays(29), 2, 2, "COMPANION",
                "Đã chốt lịch, có thêm 1 người bạn muốn đi cùng.",
                false, null
        )).id();
        bookingService.accept(b20);
        var b20Conf = bookingService.confirm(b20);
        bookingService.customize(b20, new CustomizeRequest(
                b20Conf.startDate(), b20Conf.days(), 3, 3, 0, "COMPANION",
                "Tăng từ 2 lên 3 khách người lớn, nhờ Guide kiểm tra lại phòng.",
                b20Conf.steps().stream()
                        .map(s -> new BookingStepRequest(s.dayNumber(), s.category(), s.title(), s.pricePerPerson(),
                                s.originalTitle(), s.originalPricePerPerson(), s.noteType(), s.imageUrl()))
                        .toList()
        ), tram);

        Long b21 = bookingService.create(new CreateBookingRequest(
                tHaGiang3, khang.getId(), today.plusDays(34), 3, 3, "REMOTE",
                "Đã chốt tour Hoàng Su Phì, muốn dời ngày khởi hành thêm 2 ngày.",
                false, null
        )).id();
        bookingService.accept(b21);
        var b21Conf = bookingService.confirm(b21);
        bookingService.customize(b21, new CustomizeRequest(
                b21Conf.startDate().plusDays(2), b21Conf.days(), 3, 3, 0, "REMOTE",
                "Xin dời lịch khởi hành muộn hơn 2 ngày do lịch bay thay đổi.",
                b21Conf.steps().stream()
                        .map(s -> new BookingStepRequest(s.dayNumber(), s.category(), s.title(), s.pricePerPerson(),
                                s.originalTitle(), s.originalPricePerPerson(), s.noteType(), s.imageUrl()))
                        .toList()
        ), khang);

        // #22..#24: CANCELLED
        Long b22 = bookingService.create(new CreateBookingRequest(
                tPhuQuoc3, yenCust.getId(), today.plusDays(33), 3, 2, "REMOTE",
                "Dự kiến đi Bắc đảo Phú Quốc.",
                false, null
        )).id();
        bookingService.cancel(b22, new CancelBookingRequest("Thay đổi lịch nghỉ phép công ty"), yenCust);

        Long b23 = bookingService.create(new CreateBookingRequest(
                tHaLong3, khoa.getId(), today.plusDays(36), 2, 2, "COMPANION",
                "Đặt trải nghiệm khoáng nóng Yoko Onsen.",
                false, null
        )).id();
        bookingService.cancel(b23, new CancelBookingRequest("Đổi sang lịch đi tháng sau"), khoa);

        Long b24 = bookingService.create(new CreateBookingRequest(
                tHue3, hoa.getId(), today.plusDays(35), 3, 4, "COMPANION",
                "Đoàn 4 người đi Lăng Cô – Huế.",
                false, null
        )).id();
        bookingService.cancel(b24, new CancelBookingRequest("Thành viên trong nhóm có việc đột xuất"), hoa);

        // #25..#33: COMPLETED + 9 Review (tổng 10 review trên toàn sàn)
        completeAndReview(tHaLong, hoa, today.minusDays(28), 2, 2, "COMPANION",
                "Chuyến Hạ Long cuối tuần.", 5, "Anh Bình rất nhiệt tình, chọn thuyền kayak đẹp và hải sản tươi.", 12);
        completeAndReview(tDaLat, an, today.minusDays(24), 3, 2, "REMOTE",
                "Đặt phòng săn mây Cầu Đất.", 5, "Chị Chi sắp xếp xe Jeep đúng 5h sáng, biển mây cực kỳ ấn tượng!", 14);
        completeAndReview(tHoiAn, phuong, today.minusDays(20), 2, 3, "COMPANION",
                "Gia đình khám phá phố cổ.", 5, "Anh Dũng kể chuyện lịch sử Hội An rất cuốn hút, bọn trẻ rất thích rừng dừa.", 16);
        completeAndReview(tHue, duc, today.minusDays(18), 2, 2, "COMPANION",
                "Tham quan Đại Nội & Nghe ca Huế.", 4, "Chị Thảo hướng dẫn kỹ lưỡng, cơm cung đình ngon và đúng giờ.", 18);
        completeAndReview(tNinhBinh1, thu, today.minusDays(15), 2, 2, "COMPANION",
                "Thăm Tràng An & Hang Múa.", 5, "Anh Hiếu chọn khung giờ leo Hang Múa vắng khách nên chụp được rất nhiều ảnh đẹp.", 20);
        completeAndReview(tHaGiang1, longCust, today.minusDays(14), 3, 4, "COMPANION",
                "Phượt Hà Giang cùng thổ địa.", 5, "Anh Sơn thông thuộc từng khúc cua đèo Mã Pí Lèng, đi thuyền Nho Quế quá đã!", 22);
        completeAndReview(tMocChau1, nhung, today.minusDays(12), 2, 3, "COMPANION",
                "Cuối tuần trên cao nguyên Mộc Châu.", 4, "Homestay nhà sàn sạch sẽ, bê chao và cá suối rất hợp khẩu vị.", 24);
        completeAndReview(tNhaTrang1, huy, today.minusDays(9), 3, 2, "REMOTE",
                "Lặn biển Hòn Mun.", 5, "Nước biển Hòn Mun trong vắt, anh Đạt hỗ trợ đặt cano riêng cực kỳ nhanh gọn.", 26);
        completeAndReview(tQuyNhon1, tram, today.minusDays(7), 3, 4, "COMPANION",
                "Du lịch biển Kỳ Co – Eo Gió.", 5, "Biển Kỳ Co đẹp xuất sắc, anh Hưng dẫn đi chụp ảnh góc nào cũng ưng ý.", 28);
        completeAndReview(tConDao1, khang, today.minusDays(5), 3, 2, "COMPANION",
                "Khám phá thiên nhiên Côn Đảo.", 5, "Trải nghiệm Hòn Bảy Cạnh và Bãi Đầm Trầu yên bình, dịch vụ rất chuyên nghiệp.", 30);

        // SavedTour cho một số khách hàng khác (an.nguyen được syncRealMediaAndPhotos giữ đúng 2 tour cho test)
        saveFavoriteIfAbsent(hoa, tDaLat);
        saveFavoriteIfAbsent(hoa, tNinhBinh1);
        saveFavoriteIfAbsent(khoa, tHaGiang1);
        saveFavoriteIfAbsent(phuong, tConDao1);
        saveFavoriteIfAbsent(thu, tQuyNhon1);

        log.info("Seeded expanded TripBuilder dataset: 12 regions, 24 guides, 12 customers, {} tours, {} bookings",
                tourRepository.count(), bookingRepository.count());
    }

    private Long seedTour(AppUser guide, String title, String desc, String coverImg, int days, List<TourStepRequest> steps) {
        String regionCode = guide.getRegion().getCode();
        List<String> gallery = REGION_GALLERIES.getOrDefault(regionCode, List.of(coverImg));
        return tourService.create(new SaveTourRequest(
                guide.getId(),
                guide.getRegion().getId(),
                title,
                desc,
                coverImg,
                gallery,
                days,
                steps
        )).id();
    }

    private com.tripbuilder.dto.response.booking.BookingDto customizeAddStep(
            Long bookingId, AppUser customer, int day, String category, String title, String img, String note) {
        var current = bookingService.get(bookingId, customer);
        List<BookingStepRequest> nextSteps = new ArrayList<>();
        current.steps().forEach(s -> nextSteps.add(new BookingStepRequest(
                s.dayNumber(), s.category(), s.title(), s.pricePerPerson(),
                s.originalTitle(), s.originalPricePerPerson(), s.noteType(), s.imageUrl()
        )));
        nextSteps.add(new BookingStepRequest(day, category, title, 0L, null, 0L, "CUSTOM", img));
        return bookingService.customize(bookingId, new CustomizeRequest(
                current.startDate(), current.days(), current.guests(), current.adults(), current.children(),
                current.serviceMode(), note, nextSteps
        ), customer);
    }

    private void requoteWithCustomPrice(
            Long bookingId,
            List<com.tripbuilder.dto.response.booking.BookingStepDto> currentSteps,
            long customStepPrice,
            long groupAdj,
            String guideNote) {
        List<BookingStepRequest> steps = new ArrayList<>();
        for (var s : currentSteps) {
            boolean isCustom = "CUSTOM".equals(s.noteType());
            steps.add(new BookingStepRequest(
                    s.dayNumber(),
                    s.category(),
                    s.title(),
                    isCustom ? customStepPrice : s.pricePerPerson(),
                    s.originalTitle(),
                    s.originalPricePerPerson(),
                    isCustom ? "GUIDE" : s.noteType(),
                    s.imageUrl()
            ));
        }
        var b = bookingService.get(bookingId, null);
        bookingService.requote(bookingId, new RequoteRequest(b.days(), b.guests(), groupAdj, guideNote, steps));
    }

    private void completeAndReview(
            Long tourId, AppUser customer, LocalDate pastStartDate, int days, int guests, String mode,
            String note, int rating, String reviewText, int tempFutureDaysOffset) {
        Long id = bookingService.create(new CreateBookingRequest(
                tourId, customer.getId(), LocalDate.now().plusDays(100 + tempFutureDaysOffset),
                days, guests, mode, note, false, null
        )).id();
        bookingService.accept(id);
        bookingService.confirm(id);
        bookingService.complete(id);
        bookingService.review(id, new ReviewRequest(rating, reviewText));
        shiftBookingStartDate(id, pastStartDate);
    }

    private void shiftBookingStartDate(Long bookingId, LocalDate targetDate) {
        Booking entity = bookingRepository.findById(bookingId).orElseThrow();
        entity.setStartDate(targetDate);
        bookingRepository.save(entity);
    }

    private void saveFavoriteIfAbsent(AppUser customer, Long tourId) {
        Tour tour = tourRepository.findById(tourId).orElse(null);
        if (tour == null || savedTourRepository.existsByCustomerIdAndTourId(customer.getId(), tourId)) {
            return;
        }
        savedTourRepository.save(SavedTour.builder()
                .customer(customer)
                .tour(tour)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private void syncRealMediaAndPhotos() {
        transactionTemplate.executeWithoutResult(status -> {
            Map<String, Region> regionByCode = new HashMap<>();
            regionRepository.findAll().forEach(reg -> regionByCode.put(reg.getCode(), reg));

            // 1. Đồng bộ bảng region_photos (107 ảnh: 6 dùng chung + 66 vùng cũ + 35 vùng mới)
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
        if ("ninh-binh".equals(regionCode)) {
            if (t.contains("tam cốc")) return NB_TAM_COC;
            if (t.contains("hang múa")) return NB_HANG_MUA;
            if (t.contains("bái đính")) return NB_BAI_DINH;
            if (t.contains("hoa lư")) return NB_HOA_LU;
            if (c.contains("khách sạn") || t.contains("resort")) return IMG_RESORT_SPA;
            if (c.contains("di chuyển")) return IMG_LIMO;
            if (c.contains("ăn")) return IMG_VIET_FOOD;
            return NB_TRANG_AN;
        }
        if ("ha-giang".equals(regionCode)) {
            if (t.contains("nho quế")) return HG_NHO_QUE;
            if (t.contains("tu sản")) return HG_TU_SAN;
            if (t.contains("lũng cú")) return HG_LUNG_CU;
            if (t.contains("đồng văn") || c.contains("khách sạn") || t.contains("homestay")) return HG_DONG_VAN;
            if (t.contains("thẩm mã")) return HG_THAM_MA;
            if (c.contains("di chuyển")) return IMG_LIMO;
            if (c.contains("ăn")) return IMG_BBQ;
            return HG_MA_PI_LENG;
        }
        if ("moc-chau".equals(regionCode)) {
            if (t.contains("dải yếm")) return MC_DAI_YEM_1;
            if (t.contains("nhà sàn") || c.contains("khách sạn") || t.contains("homestay")) return MC_NHA_SAN;
            if (c.contains("di chuyển")) return IMG_LIMO;
            if (c.contains("ăn")) return IMG_BBQ;
            return MC_TEA_HILL;
        }
        if ("nha-trang".equals(regionCode)) {
            if (t.contains("ponagar")) return NT_PONAGAR;
            if (t.contains("long sơn")) return NT_LONG_SON;
            if (t.contains("hòn chồng")) return NT_HON_CHONG;
            if (t.contains("hòn mun") || t.contains("san hô")) return NT_HON_MUN;
            if (c.contains("khách sạn") || t.contains("resort")) return IMG_RESORT_SPA;
            if (c.contains("ăn") || t.contains("hải sản")) return IMG_SEAFOOD;
            if (c.contains("di chuyển")) return IMG_LIMO;
            return NT_PANORAMA;
        }
        if ("quy-nhon".equals(regionCode)) {
            if (t.contains("eo gió")) return QN_EO_GIO;
            if (t.contains("tháp đôi")) return QN_THAP_DOI;
            if (t.contains("hoàng hậu") || t.contains("ghềnh ráng")) return QN_QUEENS;
            if (t.contains("nhơn lý")) return QN_NHON_LY;
            if (c.contains("khách sạn") || t.contains("resort")) return QN_VIEW;
            if (c.contains("ăn") || t.contains("hải sản")) return IMG_SEAFOOD;
            if (c.contains("di chuyển")) return IMG_LIMO;
            return QN_KY_CO;
        }
        if ("con-dao".equals(regionCode)) {
            if (t.contains("bảy cạnh") || t.contains("quốc gia")) return CD_PARK;
            if (t.contains("cá mập")) return CD_MUI_CA_MAP;
            if (t.contains("nhà tù") || t.contains("côn đảo")) return CD_PRISON;
            if (c.contains("khách sạn") || t.contains("resort")) return CD_SIX_SENSES;
            if (c.contains("ăn") || t.contains("hải sản")) return IMG_SEAFOOD;
            if (c.contains("di chuyển")) return IMG_LIMO;
            return CD_BEACH;
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
            "minh.guide@tripbuilder.vn",
            "chi.guide@tripbuilder.vn",
            "nam.guide@tripbuilder.vn",
            "dung.guide@tripbuilder.vn",
            "thao.guide@tripbuilder.vn",
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
                sp = r.get("sa-pa"), pq = r.get("phu-quoc"), hue = r.get("hue"),
                nb = r.get("ninh-binh"), hg = r.get("ha-giang"), mc = r.get("moc-chau"),
                nt = r.get("nha-trang"), qn = r.get("quy-nhon"), cd = r.get("con-dao");

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

        // 6 vùng mới (6–7 dịch vụ chuẩn / vùng)
        opt(nb, "Khách sạn", "Bungalow giữa cánh đồng Tam Cốc (1 đêm)", 750_000, NB_PANORAMA);
        opt(nb, "Khách sạn", "Emeralda Resort Ninh Bình 4★ (2 đêm)", 1_500_000, IMG_RESORT_SPA);
        opt(nb, "Trải nghiệm", "Thuyền nan danh thắng Tràng An", 400_000, NB_TRANG_AN);
        opt(nb, "Trải nghiệm", "Leo đỉnh Ngọa Long – Hang Múa & Cố đô Hoa Lư", 350_000, NB_HANG_MUA);
        opt(nb, "Trải nghiệm", "Tham quan chùa Bái Đính bằng xe điện", 400_000, NB_BAI_DINH);
        opt(nb, "Ăn uống", "Đặc sản dê núi & cơm cháy Ninh Bình", 300_000, IMG_VIET_FOOD);
        opt(nb, "Di chuyển", "Xe Limousine Hà Nội – Ninh Bình", 350_000, IMG_LIMO);

        opt(hg, "Khách sạn", "Homestay nhà trình tường Đồng Văn (2 đêm)", 700_000, HG_DONG_VAN);
        opt(hg, "Khách sạn", "Eco Lodge Hoàng Su Phì / H'Mông Village", 1_100_000, HG_DONG_VAN);
        opt(hg, "Trải nghiệm", "Đèo Mã Pí Lèng & Thuyền sông Nho Quế – Hẻm Tu Sản", 550_000, HG_NHO_QUE);
        opt(hg, "Trải nghiệm", "Cột cờ Lũng Cú & Dốc Thẩm Mã", 350_000, HG_LUNG_CU);
        opt(hg, "Ăn uống", "Lẩu gà đen & Bánh cuốn Đồng Văn", 350_000, IMG_BBQ);
        opt(hg, "Di chuyển", "Xe SUV 7 chỗ chuyên đường đèo Hà Giang", 950_000, HG_THAM_MA);

        opt(mc, "Khách sạn", "Homestay nhà sàn bản Áng (1 đêm)", 550_000, MC_NHA_SAN);
        opt(mc, "Khách sạn", "Resort Thảo Nguyên Mộc Châu 4★", 900_000, IMG_RESORT_SPA);
        opt(mc, "Trải nghiệm", "Đồi chè Trái Tim & Thung lũng mận Nà Ka", 300_000, MC_TEA_HILL);
        opt(mc, "Trải nghiệm", "Thác Dải Yếm & Cầu kính Bạch Long", 450_000, MC_DAI_YEM_1);
        opt(mc, "Ăn uống", "Bê chao Mộc Châu & Cá suối nướng", 300_000, IMG_BBQ);
        opt(mc, "Di chuyển", "Limousine Hà Nội – Mộc Châu", 400_000, IMG_LIMO);

        opt(nt, "Khách sạn", "Khách sạn mặt biển Trần Phú 4★ (2 đêm)", 1_200_000, NT_BEACH);
        opt(nt, "Khách sạn", "Resort 5★ Bãi Dài Cam Ranh (2 đêm)", 2_200_000, IMG_RESORT_SPA);
        opt(nt, "Trải nghiệm", "Cano 3 đảo & Lặn ngắm san hô Hòn Mun", 750_000, NT_HON_MUN);
        opt(nt, "Trải nghiệm", "Tháp Bà Ponagar & Tắm bùn khoáng I-Resort", 450_000, NT_PONAGAR);
        opt(nt, "Ăn uống", "Hải sản bờ kè tháp Bà & Nem nướng Ninh Hoà", 450_000, IMG_SEAFOOD);
        opt(nt, "Di chuyển", "Xe riêng đón sân bay Cam Ranh", 300_000, IMG_LIMO);

        opt(qn, "Khách sạn", "Khách sạn ven biển Quy Nhơn 4★ (2 đêm)", 1_100_000, QN_VIEW);
        opt(qn, "Khách sạn", "Resort Ghềnh Ráng 4★ (2 đêm)", 1_300_000, IMG_RESORT_SPA);
        opt(qn, "Trải nghiệm", "Cano Kỳ Co – Bãi Dứa lặn san hô & Eo Gió", 650_000, QN_EO_GIO);
        opt(qn, "Trải nghiệm", "Bãi tắm Hoàng Hậu & Tháp Đôi Quy Nhơn", 300_000, QN_QUEENS);
        opt(qn, "Ăn uống", "Hải sản Nhơn Lý & Bánh xèo tôm nhảy", 400_000, IMG_SEAFOOD);
        opt(qn, "Di chuyển", "Xe riêng đón sân bay Phù Cát", 300_000, IMG_LIMO);

        opt(cd, "Khách sạn", "Resort ven biển Côn Sơn 4★ (2 đêm)", 1_900_000, CD_SIX_SENSES);
        opt(cd, "Khách sạn", "Villa hướng biển Côn Đảo 5★ (3 đêm)", 3_800_000, CD_SIX_SENSES);
        opt(cd, "Trải nghiệm", "Cano Hòn Bảy Cạnh & Vườn quốc gia Côn Đảo", 850_000, CD_PARK);
        opt(cd, "Trải nghiệm", "Di tích Nhà tù Côn Đảo & Nghĩa trang Hàng Dương", 350_000, CD_PRISON);
        opt(cd, "Ăn uống", "Ốc vú nàng, cua mặt trăng & hải sản Côn Đảo", 550_000, IMG_SEAFOOD);
        opt(cd, "Di chuyển", "Xe đón sân bay Cỏ Ống & Mũi Cá Mập", 400_000, CD_MUI_CA_MAP);
    }

    private void opt(Region region, String cat, String title, long price, String img) {
        optionRepository.save(PresetOption.builder()
                .region(region).category(cat).title(title).pricePerPerson(price).imageUrl(img).build());
    }

    private AppUser user(String name, Role role, String email, String phone, String avatarUrl,
                         String bio, Integer years, Region region) {
        return saveUser(name, role, email, phone, avatarUrl, bio, years, region, true);
    }

    private AppUser extraUser(String name, Role role, String email, String phone, String avatarUrl,
                              String bio, Integer years, Region region) {
        return saveUser(name, role, email, phone, avatarUrl, bio, years, region, false);
    }

    private AppUser saveUser(String name, Role role, String email, String phone, String avatarUrl,
                             String bio, Integer years, Region region, boolean demo) {
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
                .demoAccount(demo)
                .build());
    }

    private void seedRegions() {
        List<Region> targets = List.of(
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
                        "/images/tours/hue/01-ngo-mon-gate.jpg"),
                region("ninh-binh", "Ninh Bình", "Ninh Bình", "Di sản", 4.9, 7,
                        "Tràng An, Tam Cốc, Hang Múa và cố đô Hoa Lư.",
                        NB_TRANG_AN),
                region("ha-giang", "Hà Giang", "Hà Giang", "Cao nguyên đá", 4.9, 8,
                        "Đèo Mã Pí Lèng, sông Nho Quế và cực Bắc Lũng Cú.",
                        HG_MA_PI_LENG),
                region("moc-chau", "Mộc Châu", "Sơn La", "Đồi chè", 4.7, 9,
                        "Đồi chè Trái Tim, thác Dải Yếm và cao nguyên xanh.",
                        MC_TEA_HILL),
                region("nha-trang", "Nha Trang", "Khánh Hoà", "Biển đảo", 4.8, 10,
                        "Vịnh biển xanh, lặn san hô Hòn Mun và Tháp Bà.",
                        NT_PANORAMA),
                region("quy-nhon", "Quy Nhơn", "Bình Định", "Biển hoang sơ", 4.8, 11,
                        "Kỳ Co, Eo Gió, Ghềnh Ráng và tháp Chăm cổ.",
                        QN_KY_CO),
                region("con-dao", "Côn Đảo", "Bà Rịa – Vũng Tàu", "Biển đảo", 4.9, 12,
                        "Bãi Đầm Trầu, Hòn Bảy Cạnh và di tích lịch sử.",
                        CD_BEACH)
        );
        Map<String, Region> existing = new HashMap<>();
        regionRepository.findAll().forEach(reg -> existing.put(reg.getCode(), reg));
        for (Region candidate : targets) {
            if (!existing.containsKey(candidate.getCode())) {
                regionRepository.save(candidate);
            }
        }
    }

    private Region region(String code, String name, String province, String tag, double rating, int order,
                          String desc, String img) {
        return Region.builder().code(code).name(name).province(province).tag(tag).rating(rating)
                .sortOrder(order).description(desc).imageUrl(img).build();
    }

    private void seedGuideApplications() {
        if (guideApplicationRepository.count() > 0) {
            return;
        }
        Region daLat = regionRepository.findByCode("da-lat").orElse(null);
        Region phuQuoc = regionRepository.findByCode("phu-quoc").orElse(null);
        Region saPa = regionRepository.findByCode("sa-pa").orElse(null);
        if (daLat == null || phuQuoc == null || saPa == null) {
            return;
        }
        AppUser admin = userRepository.findByEmailIgnoreCase("admin@tripbuilder.vn").orElse(null);
        String defaultPassHash = AuthService.hashPassword("Guide1234");
        LocalDateTime now = LocalDateTime.now();

        guideApplicationRepository.saveAll(List.of(
                GuideApplication.builder()
                        .applicationCode("GA-2026-1001")
                        .fullName("Nguyễn Hoàng Phúc")
                        .email("phuc.dalat.apply@tripbuilder.vn")
                        .phone("0918222333")
                        .passwordHash(defaultPassHash)
                        .region(daLat)
                        .yearsExperience(5)
                        .licenseNumber("HDV-LD-2021-0842")
                        .languages("Tiếng Việt, Tiếng Anh")
                        .bio("Sinh sống 12 năm tại Đà Lạt, chuyên dẫn tour trekking Langbiang, săn mây Cầu Đất và trải nghiệm nông trại cà phê đặc sản.")
                        .status(GuideApplicationStatus.PENDING)
                        .createdAt(now.minusHours(14))
                        .build(),
                GuideApplication.builder()
                        .applicationCode("GA-2026-1002")
                        .fullName("Trần Mỹ Duyên")
                        .email("duyen.phuquoc.apply@tripbuilder.vn")
                        .phone("0939444555")
                        .passwordHash(defaultPassHash)
                        .region(phuQuoc)
                        .yearsExperience(4)
                        .licenseNumber("HDV-KG-2022-0319")
                        .languages("Tiếng Việt, Tiếng Anh, Tiếng Hàn")
                        .bio("Thổ địa Nam đảo Phú Quốc, thông thạo tuyến cano 4 đảo An Thới, lặn ngắm san hô và lịch sử nhà tù Phú Quốc.")
                        .status(GuideApplicationStatus.PENDING)
                        .createdAt(now.minusHours(5))
                        .build(),
                GuideApplication.builder()
                        .applicationCode("GA-2026-1003")
                        .fullName("Lê Quốc Anh")
                        .email("quocanh.sapa.apply@tripbuilder.vn")
                        .phone("0977888999")
                        .passwordHash(defaultPassHash)
                        .region(saPa)
                        .yearsExperience(1)
                        .licenseNumber("036099001122")
                        .languages("Tiếng Việt")
                        .bio("Yêu thích du lịch Tây Bắc và có kinh nghiệm đi phượt cá nhân khu vực Sa Pa – Y Tý.")
                        .status(GuideApplicationStatus.REJECTED)
                        .reviewNote("Hồ sơ chưa bổ sung số thẻ hướng dẫn viên hợp lệ và kinh nghiệm dẫn đoàn chuyên nghiệp tại khu vực Sa Pa.")
                        .reviewedBy(admin)
                        .createdAt(now.minusDays(3))
                        .reviewedAt(now.minusDays(2))
                        .build()
        ));
    }
}
