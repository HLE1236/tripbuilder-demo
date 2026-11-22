package com.tripbuilder.dto.request.booking;

public record ReviewRequest(
        int rating,
        String review
) {}
