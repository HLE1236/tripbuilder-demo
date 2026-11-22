package com.tripbuilder.dto.response.admin;

import com.tripbuilder.entity.catalog.PresetOption;

public record AdminPresetOptionDto(
        Long id,
        Long regionId,
        String regionName,
        String category,
        String title,
        String description,
        String imageUrl,
        long pricePerPerson
) {
    public static AdminPresetOptionDto from(PresetOption o) {
        String img = (o.getImageUrl() != null && !o.getImageUrl().isBlank())
                ? o.getImageUrl()
                : o.getRegion().getImageUrl();
        return new AdminPresetOptionDto(
                o.getId(),
                o.getRegion().getId(),
                o.getRegion().getName(),
                o.getCategory(),
                o.getTitle(),
                o.getDescription(),
                img,
                o.getPricePerPerson()
        );
    }
}
