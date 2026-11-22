package com.tripbuilder.dto.request.booking;

public record BookingStepRequest(
        int dayNumber,
        String category,
        String title,
        long pricePerPerson,
        String originalTitle,
        Long originalPricePerPerson,
        String noteType,
        String imageUrl
) {}
