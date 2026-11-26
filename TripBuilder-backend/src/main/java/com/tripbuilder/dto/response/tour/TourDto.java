package com.tripbuilder.dto.response.tour;

import com.tripbuilder.dto.response.region.PhotoItemDto;
import com.tripbuilder.dto.response.user.UserDto;

import java.time.LocalDateTime;
import java.util.List;

public record TourDto(
        Long id,
        String title,
        String description,
        String imageUrl,
        List<String> galleryUrls,
        List<PhotoItemDto> galleryItems,
        int days,
        long basePricePerPerson,
        int version,
        boolean active,
        Double averageRating,
        int reviewCount,
        List<TourReviewDto> reviews,
        Long regionId,
        String regionName,
        String province,
        UserDto guide,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<TourStepDto> steps
) {}
