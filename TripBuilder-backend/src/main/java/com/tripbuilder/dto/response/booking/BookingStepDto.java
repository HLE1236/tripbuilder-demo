package com.tripbuilder.dto.response.booking;

import com.tripbuilder.entity.booking.BookingStep;

public record BookingStepDto(
        Long id,
        int dayNumber,
        String category,
        String title,
        String imageUrl,
        long pricePerPerson,
        String originalTitle,
        Long originalPricePerPerson,
        String noteType
) {
    public static BookingStepDto from(BookingStep s, String fallbackImg) {
        String img = (s.getImageUrl() != null && !s.getImageUrl().isBlank()) ? s.getImageUrl() : fallbackImg;
        return new BookingStepDto(
                s.getId(),
                s.getDayNumber(),
                s.getCategory(),
                s.getTitle(),
                img,
                s.getPricePerPerson(),
                s.getOriginalTitle(),
                s.getOriginalPricePerPerson(),
                s.getNoteType()
        );
    }
}
