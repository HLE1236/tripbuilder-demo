package com.tripbuilder.dto.response.tour;

import com.tripbuilder.entity.tour.TourStep;

public record TourStepDto(
        Long id,
        int dayNumber,
        String category,
        String title,
        String imageUrl,
        long pricePerPerson
) {
    public static TourStepDto from(TourStep s, String fallbackImg) {
        String img = (s.getImageUrl() != null && !s.getImageUrl().isBlank()) ? s.getImageUrl() : fallbackImg;
        return new TourStepDto(s.getId(), s.getDayNumber(), s.getCategory(), s.getTitle(), img, s.getPricePerPerson());
    }
}
