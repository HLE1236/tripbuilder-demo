package com.tripbuilder.dto.response.guide;

import com.tripbuilder.entity.guide.GuideApplication;
import com.tripbuilder.entity.guide.GuideApplicationStatus;

import java.time.LocalDateTime;

public record GuideApplicationStatusDto(
        String applicationCode,
        String fullName,
        String email,
        String regionName,
        String province,
        GuideApplicationStatus status,
        String reviewNote,
        LocalDateTime createdAt,
        LocalDateTime reviewedAt
) {
    public static GuideApplicationStatusDto from(GuideApplication app) {
        return new GuideApplicationStatusDto(
                app.getApplicationCode(),
                app.getFullName(),
                app.getEmail(),
                app.getRegion() != null ? app.getRegion().getName() : null,
                app.getRegion() != null ? app.getRegion().getProvince() : null,
                app.getStatus(),
                app.getReviewNote(),
                app.getCreatedAt(),
                app.getReviewedAt()
        );
    }
}
