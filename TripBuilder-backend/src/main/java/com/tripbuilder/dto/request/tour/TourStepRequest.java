package com.tripbuilder.dto.request.tour;

public record TourStepRequest(
        int dayNumber,
        String category,
        String title,
        long pricePerPerson,
        String imageUrl
) {}
