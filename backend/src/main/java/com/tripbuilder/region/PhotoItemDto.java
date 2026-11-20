package com.tripbuilder.region;

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
