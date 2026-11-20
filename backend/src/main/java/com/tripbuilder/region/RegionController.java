package com.tripbuilder.region;

import com.tripbuilder.common.ApiResponse;
import com.tripbuilder.common.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/** API đọc danh sách khu vực / điểm đến và kho ảnh địa danh từ database. */
@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class RegionController {

    private final RegionRepository regionRepository;
    private final RegionPhotoRepository regionPhotoRepository;

    @GetMapping
    public ApiResponse<List<RegionDto>> getAll() {
        List<Region> regions = regionRepository.findAllByOrderBySortOrderAsc();
        Map<Long, List<RegionPhoto>> photosByRegion = regionPhotoRepository
                .findAllByOrderBySortOrderAscIdAsc()
                .stream()
                .filter(p -> p.getRegion() != null)
                .collect(Collectors.groupingBy(p -> p.getRegion().getId()));

        List<RegionDto> result = regions.stream().map(region -> {
            List<RegionPhoto> photos = photosByRegion.getOrDefault(region.getId(), List.of());
            List<PhotoItemDto> previews = photos.stream()
                    .limit(4)
                    .map(PhotoItemDto::from)
                    .toList();
            return RegionDto.from(region, photos.size(), previews);
        }).toList();
        return ApiResponse.ok(result);
    }

    @GetMapping("/{id}/photos")
    public ApiResponse<List<PhotoItemDto>> getRegionPhotos(
            @PathVariable Long id,
            @RequestParam(required = false) String category) {
        regionRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy khu vực ID " + id));
        List<RegionPhoto> photos = (category != null && !category.isBlank())
                ? regionPhotoRepository.findByRegionIdAndCategoryOrderBySortOrderAscIdAsc(id, category.trim())
                : regionPhotoRepository.findByRegionIdOrderBySortOrderAscIdAsc(id);
        return ApiResponse.ok(photos.stream().map(PhotoItemDto::from).toList());
    }

    @GetMapping("/photos")
    public ApiResponse<List<PhotoItemDto>> getAllPhotos(@RequestParam(required = false) String category) {
        List<RegionPhoto> photos = (category != null && !category.isBlank())
                ? regionPhotoRepository.findByCategoryOrderBySortOrderAscIdAsc(category.trim())
                : regionPhotoRepository.findAllByOrderBySortOrderAscIdAsc();
        return ApiResponse.ok(photos.stream().map(PhotoItemDto::from).toList());
    }
}
