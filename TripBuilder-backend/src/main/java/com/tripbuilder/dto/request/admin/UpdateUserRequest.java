package com.tripbuilder.dto.request.admin;

public record UpdateUserRequest(
        String fullName,
        String phone,
        Long regionId,
        String bio,
        Integer yearsExperience
) {}
