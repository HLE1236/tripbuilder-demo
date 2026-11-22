package com.tripbuilder.dto.request.tour;

import java.util.List;

public record SaveTourRequest(
        Long guideId,
        Long regionId,
        String title,
        String description,
        String imageUrl,
        List<String> galleryUrls,
        int days,
        List<TourStepRequest> steps
) {}
