package com.tripbuilder.dto.response.catalog;

import com.tripbuilder.entity.catalog.PresetOption;

public record OptionDto(
        Long id,
        Long regionId,
        String category,
        String title,
        String imageUrl,
        long pricePerPerson
) {
    public static OptionDto from(PresetOption o) {
        String img = (o.getImageUrl() != null && !o.getImageUrl().isBlank())
                ? o.getImageUrl()
                : o.getRegion().getImageUrl();
        return new OptionDto(
                o.getId(),
                o.getRegion().getId(),
                o.getCategory(),
                o.getTitle(),
                img,
                o.getPricePerPerson()
        );
    }
}
