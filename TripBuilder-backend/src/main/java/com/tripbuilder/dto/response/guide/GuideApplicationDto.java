package com.tripbuilder.dto.response.guide;

import com.tripbuilder.entity.guide.GuideApplication;
import com.tripbuilder.entity.guide.GuideApplicationStatus;

import java.time.LocalDateTime;

public record GuideApplicationDto(
        Long id,
        String applicationCode,
        String fullName,
        String email,
        String phone,
        Long regionId,
        String regionName,
        String province,
        Integer yearsExperience,
        String licenseNumber,
        String languages,
        String bio,
        GuideApplicationStatus status,
        String reviewNote,
        String reviewedByName,
        Long createdUserId,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt
) {
    public static GuideApplicationDto from(GuideApplication app) {
        return new GuideApplicationDto(
                app.getId(),
                app.getApplicationCode(),
                app.getFullName(),
                app.getEmail(),
                app.getPhone(),
                app.getRegion() != null ? app.getRegion().getId() : null,
                app.getRegion() != null ? app.getRegion().getName() : null,
                app.getRegion() != null ? app.getRegion().getProvince() : null,
                app.getYearsExperience(),
                app.getLicenseNumber(),
                app.getLanguages(),
                app.getBio(),
                app.getStatus(),
                app.getReviewNote(),
                app.getReviewedBy() != null ? app.getReviewedBy().getFullName() : null,
                app.getCreatedUser() != null ? app.getCreatedUser().getId() : null,
                app.getCreatedAt(),
                app.getReviewedAt()
        );
    }
}
