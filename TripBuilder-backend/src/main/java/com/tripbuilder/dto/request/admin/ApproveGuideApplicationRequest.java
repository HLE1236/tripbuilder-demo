package com.tripbuilder.dto.request.admin;

public record ApproveGuideApplicationRequest(
        Long regionId,
        String reviewNote
) {}
