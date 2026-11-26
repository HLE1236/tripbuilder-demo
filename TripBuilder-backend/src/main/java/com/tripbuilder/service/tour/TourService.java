package com.tripbuilder.service.tour;

import com.tripbuilder.entity.tour.Tour;
import com.tripbuilder.entity.tour.TourStep;
import com.tripbuilder.repository.TourRepository;

import com.tripbuilder.dto.request.tour.SaveTourRequest;
import com.tripbuilder.dto.request.tour.TourStatusRequest;
import com.tripbuilder.dto.request.tour.TourStepRequest;
import com.tripbuilder.dto.response.region.PhotoItemDto;
import com.tripbuilder.dto.response.tour.TourDto;
import com.tripbuilder.dto.response.tour.TourReviewDto;
import com.tripbuilder.dto.response.tour.TourStepDto;
import com.tripbuilder.dto.response.user.UserDto;
import com.tripbuilder.entity.booking.Booking;
import com.tripbuilder.entity.region.Region;
import com.tripbuilder.entity.region.RegionPhoto;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.exception.BadRequestException;
import com.tripbuilder.exception.ForbiddenException;
import com.tripbuilder.repository.BookingRepository;
import com.tripbuilder.repository.RegionPhotoRepository;
import com.tripbuilder.repository.RegionRepository;
import com.tripbuilder.repository.SavedTourRepository;
import com.tripbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TourService {

    private static final int MAX_GALLERY_IMAGES = 20;
    private static final int MAX_GALLERY_COLUMN_LENGTH = 4000;

    private final TourRepository tourRepository;
    private final UserRepository userRepository;
    private final RegionRepository regionRepository;
    private final RegionPhotoRepository regionPhotoRepository;
    private final BookingRepository bookingRepository;
    private final SavedTourRepository savedTourRepository;

    @Transactional(readOnly = true)
    public List<TourDto> list(Long guideId) {
        return list(guideId, null, null, null, null, null, false, null);
    }

    @Transactional(readOnly = true)
    public List<TourDto> list(Long guideId,
                              Long regionId,
                              Integer minDays,
                              Integer maxDays,
                              String q,
                              String sort) {
        return list(guideId, regionId, minDays, maxDays, q, sort, false, null);
    }

    @Transactional(readOnly = true)
    public List<TourDto> list(Long guideId,
                              Long regionId,
                              Integer minDays,
                              Integer maxDays,
                              String q,
                              String sort,
                              boolean includeInactive,
                              AppUser actingUser) {
        List<Tour> base = guideId == null
                ? tourRepository.findAllByOrderByIdDesc()
                : tourRepository.findByGuideIdOrderByIdDesc(guideId);

        String keyword = (q != null && !q.isBlank()) ? q.trim().toLowerCase(Locale.ROOT) : null;
        boolean isAdmin = actingUser != null && actingUser.getRole() == Role.ADMIN;
        Long actingGuideId = (actingUser != null && actingUser.getRole() == Role.GUIDE) ? actingUser.getId() : null;

        List<Tour> filtered = new ArrayList<>(base.stream()
                .filter(t -> {
                    boolean isActive = !Boolean.FALSE.equals(t.getActive());
                    if (isActive) return true;
                    if (!includeInactive) return false;
                    if (isAdmin) return true;
                    return actingGuideId != null && t.getGuide() != null && actingGuideId.equals(t.getGuide().getId());
                })
                .filter(t -> regionId == null || (t.getRegion() != null && Objects.equals(t.getRegion().getId(), regionId)))
                .filter(t -> minDays == null || (t.getDays() != null && t.getDays() >= minDays))
                .filter(t -> maxDays == null || (t.getDays() != null && t.getDays() <= maxDays))
                .filter(t -> keyword == null || matchesKeyword(t, keyword))
                .toList());

        Comparator<Tour> comparator = resolveSortComparator(sort);
        if (comparator != null) {
            filtered.sort(comparator);
        }

        Map<String, RegionPhoto> photoMap = loadPhotoMap();
        Map<Long, List<TourReviewDto>> reviewMap = loadReviewMap();
        return filtered.stream().map(t -> toDto(t, photoMap, reviewMap.getOrDefault(t.getId(), List.of()))).toList();
    }

    @Transactional(readOnly = true)
    public TourDto get(Long id) {
        return toDto(find(id));
    }

    @Transactional
    public TourDto create(SaveTourRequest req) {
        if (req == null) {
            throw new BadRequestException("Dữ liệu tour không hợp lệ");
        }
        AppUser guide = userRepository.findById(req.guideId() == null ? -1 : req.guideId())
                .filter(u -> u.getRole() == Role.GUIDE)
                .orElseThrow(() -> new BadRequestException("Tài khoản Tour Guide không hợp lệ"));
        if (guide.getRegion() == null) {
            throw new BadRequestException("Tài khoản Guide chưa được gán vùng phụ trách. Vui lòng liên hệ Admin.");
        }
        Region region = guide.getRegion();

        LocalDateTime now = LocalDateTime.now();
        Tour tour = Tour.builder()
                .guide(guide)
                .region(region)
                .version(1)
                .active(true)
                .createdAt(now)
                .updatedAt(now)
                .build();
        applyFields(tour, region, req);
        return toDto(tourRepository.save(tour));
    }

    @Transactional
    public TourDto update(Long id, SaveTourRequest req, AppUser actingGuide) {
        if (req == null) {
            throw new BadRequestException("Dữ liệu cập nhật tour không hợp lệ");
        }
        Tour tour = find(id);
        if (actingGuide != null && !tour.getGuide().getId().equals(actingGuide.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể chỉnh sửa tour do chính mình đăng");
        }
        AppUser ownerGuide = tour.getGuide();
        if (ownerGuide.getRegion() == null) {
            throw new BadRequestException("Tài khoản Guide chưa được gán vùng phụ trách. Vui lòng liên hệ Admin.");
        }
        Region region = ownerGuide.getRegion();
        if (!Objects.equals(region.getId(), tour.getRegion().getId()) && bookingRepository.existsByTourId(id)) {
            throw new BadRequestException("Không thể thay đổi khu vực của tour đã có đơn đặt");
        }
        tour.setRegion(region);
        tour.setVersion((tour.getVersion() == null ? 1 : tour.getVersion()) + 1);
        tour.setUpdatedAt(LocalDateTime.now());
        applyFields(tour, region, req);
        tourRepository.flush();
        return toDto(tour);
    }

    @Transactional
    public TourDto updateStatus(Long id, TourStatusRequest req, AppUser actingUser) {
        if (req == null || req.active() == null) {
            throw new BadRequestException("Trạng thái tour không hợp lệ");
        }
        Tour tour = find(id);
        if (actingUser != null && actingUser.getRole() != Role.ADMIN
                && !tour.getGuide().getId().equals(actingUser.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể thay đổi trạng thái tour do chính mình đăng");
        }
        tour.setActive(req.active());
        tour.setUpdatedAt(LocalDateTime.now());
        tourRepository.flush();
        return toDto(tour);
    }

    @Transactional
    public void delete(Long id, AppUser actingUser) {
        Tour tour = find(id);
        if (actingUser != null && actingUser.getRole() != Role.ADMIN
                && !tour.getGuide().getId().equals(actingUser.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể xoá tour do chính mình đăng");
        }
        if (bookingRepository.existsByTourId(id)) {
            throw new BadRequestException("Không thể xoá tour mẫu đã có hồ sơ đặt tour của khách");
        }
        savedTourRepository.deleteByTourId(id);
        tourRepository.delete(tour);
    }

    private void applyFields(Tour tour, Region region, SaveTourRequest req) {
        if (req.title() == null || req.title().isBlank()) {
            throw new BadRequestException("Vui lòng nhập tên Tour");
        }
        String trimmedTitle = req.title().trim();
        if (trimmedTitle.length() > 200) {
            throw new BadRequestException("Tên tour không được vượt quá 200 ký tự");
        }
        if (req.description() != null && req.description().length() > 1000) {
            throw new BadRequestException("Mô tả tour không được vượt quá 1000 ký tự");
        }
        if (req.days() < 1 || req.days() > 10) {
            throw new BadRequestException("Số ngày của tour phải từ 1 đến 10");
        }
        if (req.steps() == null || req.steps().isEmpty()) {
            throw new BadRequestException("Lịch trình tour phải có ít nhất 1 hoạt động");
        }

        tour.setTitle(trimmedTitle);
        tour.setDescription(req.description());
        String coverImg = (req.imageUrl() == null || req.imageUrl().isBlank())
                ? region.getImageUrl()
                : validateSafeImageUrl(req.imageUrl());
        tour.setImageUrl(coverImg);

        if (req.galleryUrls() != null) {
            Set<String> orderedGallery = new LinkedHashSet<>();
            orderedGallery.add(coverImg);
            for (String raw : req.galleryUrls()) {
                if (raw == null || raw.isBlank()) continue;
                orderedGallery.add(validateSafeImageUrl(raw));
            }
            if (orderedGallery.size() > MAX_GALLERY_IMAGES) {
                throw new BadRequestException("Bộ ảnh tour tối đa " + MAX_GALLERY_IMAGES + " ảnh");
            }
            String joined = String.join("|", orderedGallery);
            if (joined.length() > MAX_GALLERY_COLUMN_LENGTH) {
                throw new BadRequestException("Tổng độ dài danh sách ảnh vượt quá giới hạn cho phép");
            }
            tour.setGalleryImages(orderedGallery.isEmpty() ? null : joined);
        }

        tour.getSteps().clear();
        long sum = 0;
        int order = 1;
        for (TourStepRequest s : req.steps()) {
            if (s == null || s.title() == null || s.title().isBlank()) continue;
            if (s.pricePerPerson() < 0 || s.pricePerPerson() > 500_000_000L) {
                throw new BadRequestException("Đơn giá hoạt động phải từ 0đ đến 500.000.000đ");
            }
            int day = Math.max(1, Math.min(req.days(), s.dayNumber()));
            long price = s.pricePerPerson();
            String stepImg = (s.imageUrl() != null && !s.imageUrl().isBlank())
                    ? validateSafeImageUrl(s.imageUrl())
                    : null;
            sum += price;
            tour.getSteps().add(TourStep.builder()
                    .tour(tour)
                    .dayNumber(day)
                    .category(s.category() == null || s.category().isBlank() ? "Hoạt động" : s.category())
                    .title(s.title().trim())
                    .imageUrl(stepImg)
                    .pricePerPerson(price)
                    .sortOrder(order++)
                    .build());
        }
        if (tour.getSteps().isEmpty()) {
            throw new BadRequestException("Vui lòng nhập nội dung hoạt động cho lịch trình");
        }
        tour.setDays(req.days());
        tour.setBasePricePerPerson(sum);
    }

    private static String validateSafeImageUrl(String rawUrl) {
        String trimmed = rawUrl.trim();
        String lower = trimmed.toLowerCase(Locale.ROOT);
        if (trimmed.contains("|") || lower.startsWith("javascript:") || lower.startsWith("data:")) {
            throw new BadRequestException("Đường dẫn ảnh không hợp lệ");
        }
        return trimmed;
    }

    private static boolean matchesKeyword(Tour t, String keyword) {
        if (t.getTitle() != null && t.getTitle().toLowerCase(Locale.ROOT).contains(keyword)) return true;
        if (t.getDescription() != null && t.getDescription().toLowerCase(Locale.ROOT).contains(keyword)) return true;
        if (t.getRegion() != null) {
            if (t.getRegion().getName() != null && t.getRegion().getName().toLowerCase(Locale.ROOT).contains(keyword)) {
                return true;
            }
            if (t.getRegion().getProvince() != null && t.getRegion().getProvince().toLowerCase(Locale.ROOT).contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private static Comparator<Tour> resolveSortComparator(String sort) {
        if (sort == null || sort.isBlank() || "newest".equalsIgnoreCase(sort)) {
            return null;
        }
        return switch (sort.trim().toLowerCase(Locale.ROOT)) {
            case "price_asc" -> Comparator.comparing(Tour::getBasePricePerPerson, Comparator.nullsLast(Long::compareTo));
            case "price_desc" -> Comparator.comparing(Tour::getBasePricePerPerson, Comparator.nullsLast(Long::compareTo)).reversed();
            case "days_asc" -> Comparator.comparing(Tour::getDays, Comparator.nullsLast(Integer::compareTo));
            case "days_desc" -> Comparator.comparing(Tour::getDays, Comparator.nullsLast(Integer::compareTo)).reversed();
            default -> null;
        };
    }

    public Tour find(Long id) {
        return tourRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tour ID " + id));
    }

    public TourDto toDto(Tour t) {
        List<TourReviewDto> reviews = bookingRepository.findByTourIdAndCustomerRatingIsNotNullOrderByUpdatedAtDesc(t.getId())
                .stream()
                .map(TourService::toReviewDto)
                .toList();
        return toDto(t, loadPhotoMap(), reviews);
    }

    private Map<Long, List<TourReviewDto>> loadReviewMap() {
        Map<Long, List<TourReviewDto>> map = new LinkedHashMap<>();
        for (Booking b : bookingRepository.findByCustomerRatingIsNotNullOrderByUpdatedAtDesc()) {
            if (b.getTour() != null && b.getTour().getId() != null) {
                map.computeIfAbsent(b.getTour().getId(), k -> new ArrayList<>())
                        .add(toReviewDto(b));
            }
        }
        return map;
    }

    private static TourReviewDto toReviewDto(Booking b) {
        return new TourReviewDto(
                b.getCode(),
                b.getCustomer() != null ? b.getCustomer().getFullName() : "Khách hàng",
                b.getCustomerRating(),
                b.getCustomerReview(),
                b.getUpdatedAt()
        );
    }

    private Map<String, RegionPhoto> loadPhotoMap() {
        Map<String, RegionPhoto> map = new LinkedHashMap<>();
        for (RegionPhoto p : regionPhotoRepository.findAllByOrderBySortOrderAscIdAsc()) {
            if (p.getUrl() != null) {
                map.putIfAbsent(p.getUrl(), p);
            }
        }
        return map;
    }

    private TourDto toDto(Tour t, Map<String, RegionPhoto> photoMap, List<TourReviewDto> reviews) {
        String cover = t.getImageUrl() != null && !t.getImageUrl().isBlank()
                ? t.getImageUrl()
                : t.getRegion().getImageUrl();

        Set<String> gallerySet = new LinkedHashSet<>();
        gallerySet.add(cover);
        if (t.getGalleryImages() != null && !t.getGalleryImages().isBlank()) {
            Arrays.stream(t.getGalleryImages().split("\\|"))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .forEach(gallerySet::add);
        }
        List<String> gallery = new ArrayList<>(gallerySet);

        String fallbackCaption = (t.getRegion() != null ? t.getRegion().getName() + " · " : "") + t.getTitle();
        List<PhotoItemDto> galleryItems = gallery.stream().map(url -> {
            RegionPhoto matched = photoMap.get(url);
            if (matched != null) {
                return PhotoItemDto.from(matched);
            }
            return new PhotoItemDto(null, url, t.getTitle(), fallbackCaption, "Ảnh tour", null);
        }).toList();

        List<TourReviewDto> safeReviews = reviews != null ? reviews : List.of();
        int reviewCount = safeReviews.size();
        Double averageRating = reviewCount == 0 ? null
                : Math.round(safeReviews.stream().mapToInt(TourReviewDto::rating).average().orElse(0.0) * 10.0) / 10.0;

        return new TourDto(
                t.getId(),
                t.getTitle(),
                t.getDescription(),
                cover,
                gallery,
                galleryItems,
                t.getDays(),
                t.getBasePricePerPerson(),
                t.getVersion() == null ? 1 : t.getVersion(),
                !Boolean.FALSE.equals(t.getActive()),
                averageRating,
                reviewCount,
                safeReviews,
                t.getRegion().getId(),
                t.getRegion().getName(),
                t.getRegion().getProvince(),
                UserDto.from(t.getGuide()),
                t.getCreatedAt(),
                t.getUpdatedAt() != null ? t.getUpdatedAt() : t.getCreatedAt(),
                t.getSteps().stream().map(s -> TourStepDto.from(s, cover)).toList()
        );
    }
}
