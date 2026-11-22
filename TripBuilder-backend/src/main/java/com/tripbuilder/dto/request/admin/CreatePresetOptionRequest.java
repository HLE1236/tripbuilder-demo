package com.tripbuilder.dto.request.admin;

public record CreatePresetOptionRequest(
        Long regionId,
        String category,
        String title,
        String description,
        String imageUrl,
        Long pricePerPerson
) {}
