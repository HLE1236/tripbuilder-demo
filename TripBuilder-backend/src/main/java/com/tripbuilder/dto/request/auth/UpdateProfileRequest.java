package com.tripbuilder.dto.request.auth;

public record UpdateProfileRequest(
        String fullName,
        String phone,
        String avatarUrl
) {}
