package com.tripbuilder.region;

public record RegionDto(
        Long id,
        String code,
        String name,
        String province,
        String description,
        String imageUrl,
        String tag,
        Double rating
) {
    public static RegionDto from(Region r) {
        return new RegionDto(r.getId(), r.getCode(), r.getName(), r.getProvince(),
                r.getDescription(), r.getImageUrl(), r.getTag(), r.getRating());
    }
}
