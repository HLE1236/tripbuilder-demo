package com.tripbuilder.service.region;

import com.tripbuilder.dto.response.region.PhotoItemDto;
import com.tripbuilder.dto.response.region.RegionDto;
import com.tripbuilder.entity.region.Region;
import com.tripbuilder.entity.region.RegionPhoto;
import com.tripbuilder.exception.BadRequestException;
import com.tripbuilder.repository.RegionPhotoRepository;
import com.tripbuilder.repository.RegionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegionService {

    private final RegionRepository regionRepository;
    private final RegionPhotoRepository regionPhotoRepository;

    @Transactional(readOnly = true)
    public List<RegionDto> getAll() {
        List<Region> regions = regionRepository.findAllByOrderBySortOrderAsc();
        Map<Long, List<RegionPhoto>> photosByRegion = regionPhotoRepository
                .findAllByOrderBySortOrderAscIdAsc()
                .stream()
                .filter(p -> p.getRegion() != null)
                .collect(Collectors.groupingBy(p -> p.getRegion().getId()));

        return regions.stream().map(region -> {
            List<RegionPhoto> photos = photosByRegion.getOrDefault(region.getId(), List.of());
            List<PhotoItemDto> previews = photos.stream()
                    .limit(4)
                    .map(PhotoItemDto::from)
                    .toList();
            return RegionDto.from(region, photos.size(), previews);
        }).toList();
    }

    @Transactional(readOnly = true)
    public List<PhotoItemDto> getRegionPhotos(Long id, String category) {
        regionRepository.findById(id)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy khu vực ID " + id));
        List<RegionPhoto> photos = (category != null && !category.isBlank())
                ? regionPhotoRepository.findByRegionIdAndCategoryOrderBySortOrderAscIdAsc(id, category.trim())
                : regionPhotoRepository.findByRegionIdOrderBySortOrderAscIdAsc(id);
        return photos.stream().map(PhotoItemDto::from).toList();
    }

    @Transactional(readOnly = true)
    public List<PhotoItemDto> getAllPhotos(String category) {
        List<RegionPhoto> photos = (category != null && !category.isBlank())
                ? regionPhotoRepository.findByCategoryOrderBySortOrderAscIdAsc(category.trim())
                : regionPhotoRepository.findAllByOrderBySortOrderAscIdAsc();
        return photos.stream().map(PhotoItemDto::from).toList();
    }

    @Transactional(readOnly = true)
    public long count() {
        return regionRepository.count();
    }
}
