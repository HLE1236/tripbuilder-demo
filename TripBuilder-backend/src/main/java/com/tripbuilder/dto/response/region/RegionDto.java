package com.tripbuilder.dto.response.region;

import com.tripbuilder.entity.region.Region;

import java.util.List;

public record RegionDto(
        Long id,
        String code,
        String name,
        String province,
        String description,
        String imageUrl,
        String tag,
        Double rating,
        long photoCount,
        List<PhotoItemDto> previewPhotos
) {
    public static RegionDto from(Region r) {
        return from(r, 0L, List.of());
    }

    public static RegionDto from(Region r, long photoCount, List<PhotoItemDto> previewPhotos) {
        return new RegionDto(
                r.getId(),
                r.getCode(),
                r.getName(),
                r.getProvince(),
                r.getDescription(),
                r.getImageUrl(),
                r.getTag(),
                r.getRating(),
                photoCount,
                previewPhotos != null ? previewPhotos : List.of()
        );
    }
}
