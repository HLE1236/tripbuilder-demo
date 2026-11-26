package com.tripbuilder.dto.request.guide;

public record CreateGuideApplicationRequest(
        String fullName,
        String email,
        String phone,
        String password,
        String confirmPassword,
        Long regionId,
        Integer yearsExperience,
        String licenseNumber,
        String languages,
        String bio,
        Boolean acceptedTerms
) {}
