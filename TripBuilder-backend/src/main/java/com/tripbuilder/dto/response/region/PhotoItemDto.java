package com.tripbuilder.dto.response.region;

import com.tripbuilder.entity.region.RegionPhoto;

public record PhotoItemDto(
        Long id,
        String url,
        String landmarkName,
        String caption,
        String category,
        String credit
) {
    public static PhotoItemDto from(RegionPhoto p) {
        return new PhotoItemDto(
                p.getId(),
                p.getUrl(),
                p.getLandmarkName(),
                p.getCaption(),
                p.getCategory(),
                p.getCredit()
        );
    }
}
