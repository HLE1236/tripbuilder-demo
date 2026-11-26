package com.tripbuilder.dto.response.tour;

import java.time.LocalDateTime;

public record TourReviewDto(
        String bookingCode,
        String customerName,
        Integer rating,
        String comment,
        LocalDateTime createdAt
) {}
