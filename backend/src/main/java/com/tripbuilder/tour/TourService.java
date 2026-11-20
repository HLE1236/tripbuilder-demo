package com.tripbuilder.tour;

import com.tripbuilder.common.BadRequestException;
import com.tripbuilder.common.ForbiddenException;
import com.tripbuilder.region.PhotoItemDto;
import com.tripbuilder.region.Region;
import com.tripbuilder.region.RegionPhoto;
import com.tripbuilder.region.RegionPhotoRepository;
import com.tripbuilder.region.RegionRepository;
import com.tripbuilder.user.AppUser;
import com.tripbuilder.user.Role;
import com.tripbuilder.user.UserDto;
import com.tripbuilder.user.UserRepository;
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

    public record StepInput(
            int dayNumber,
            String category,
            String title,
            long pricePerPerson,
            String imageUrl
    ) {}

    public record StepDto(
            Long id,
            int dayNumber,
            String category,
            String title,
            String imageUrl,
            long pricePerPerson
    ) {
        public static StepDto from(TourStep s, String fallbackImg) {
            String img = (s.getImageUrl() != null && !s.getImageUrl().isBlank()) ? s.getImageUrl() : fallbackImg;
            return new StepDto(s.getId(), s.getDayNumber(), s.getCategory(), s.getTitle(), img, s.getPricePerPerson());
        }
    }

    public record TourDto(
            Long id,
            String title,
            String description,
            String imageUrl,
            List<String> galleryUrls,
            List<PhotoItemDto> galleryItems,
            int days,
            long basePricePerPerson,
            int version,
            Long regionId,
            String regionName,
            String province,
            UserDto guide,
            LocalDateTime createdAt,
            LocalDateTime updatedAt,
            List<StepDto> steps
    ) {}

    public record SaveTourRequest(
            Long guideId,
            Long regionId,
            String title,
            String description,
            String imageUrl,
            List<String> galleryUrls,
            int days,
            List<StepInput> steps
    ) {}

    @Transactional(readOnly = true)
    public List<TourDto> list(Long guideId) {
        return list(guideId, null, null, null, null, null);
    }

    @Transactional(readOnly = true)
    public List<TourDto> list(Long guideId,
                              Long regionId,
                              Integer minDays,
                              Integer maxDays,
                              String q,
                              String sort) {
        List<Tour> base = guideId == null
                ? tourRepository.findAllByOrderByIdDesc()
                : tourRepository.findByGuideIdOrderByIdDesc(guideId);

        String keyword = (q != null && !q.isBlank()) ? q.trim().toLowerCase(Locale.ROOT) : null;

        List<Tour> filtered = new ArrayList<>(base.stream()
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
        return filtered.stream().map(t -> toDto(t, photoMap)).toList();
    }

    @Transactional(readOnly = true)
    public TourDto get(Long id) {
        return toDto(find(id));
    }

    @Transactional
    public TourDto create(SaveTourRequest req) {
        AppUser guide = userRepository.findById(req.guideId() == null ? -1 : req.guideId())
                .filter(u -> u.getRole() == Role.GUIDE)
                .orElseThrow(() -> new BadRequestException("Tài khoản Tour Guide không hợp lệ"));
        Region region = regionRepository.findById(req.regionId() == null ? -1 : req.regionId())
                .orElseThrow(() -> new BadRequestException("Vui lòng chọn khu vực điểm đến"));

        LocalDateTime now = LocalDateTime.now();
        Tour tour = Tour.builder()
                .guide(guide)
                .region(region)
                .version(1)
                .createdAt(now)
                .updatedAt(now)
                .build();
        applyFields(tour, region, req);
        return toDto(tourRepository.save(tour));
    }

    @Transactional
    public TourDto update(Long id, SaveTourRequest req, AppUser actingGuide) {
        Tour tour = find(id);
        if (actingGuide != null && !tour.getGuide().getId().equals(actingGuide.getId())) {
            throw new ForbiddenException("Bạn chỉ có thể chỉnh sửa tour do chính mình đăng");
        }
        Region region = req.regionId() != null
                ? regionRepository.findById(req.regionId()).orElse(tour.getRegion())
                : tour.getRegion();
        tour.setRegion(region);
        tour.setVersion((tour.getVersion() == null ? 1 : tour.getVersion()) + 1);
        tour.setUpdatedAt(LocalDateTime.now());
        applyFields(tour, region, req);
        tourRepository.flush();
        return toDto(tour);
    }

    private void applyFields(Tour tour, Region region, SaveTourRequest req) {
        if (req.title() == null || req.title().isBlank()) {
            throw new BadRequestException("Vui lòng nhập tên Tour");
        }
        if (req.days() < 1 || req.days() > 10) {
            throw new BadRequestException("Số ngày của tour phải từ 1 đến 10");
        }
        if (req.steps() == null || req.steps().isEmpty()) {
            throw new BadRequestException("Lịch trình tour phải có ít nhất 1 hoạt động");
        }

        tour.setTitle(req.title().trim());
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
        for (StepInput s : req.steps()) {
            if (s.title() == null || s.title().isBlank()) continue;
            int day = Math.max(1, Math.min(req.days(), s.dayNumber()));
            long price = Math.max(0, s.pricePerPerson());
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
        return toDto(t, loadPhotoMap());
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

    private TourDto toDto(Tour t, Map<String, RegionPhoto> photoMap) {
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
                t.getRegion().getId(),
                t.getRegion().getName(),
                t.getRegion().getProvince(),
                UserDto.from(t.getGuide()),
                t.getCreatedAt(),
                t.getUpdatedAt() != null ? t.getUpdatedAt() : t.getCreatedAt(),
                t.getSteps().stream().map(s -> StepDto.from(s, cover)).toList()
        );
    }
}
