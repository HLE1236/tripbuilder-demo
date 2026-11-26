package com.tripbuilder.dto.request.auth;

public record ChangePasswordRequest(
        String currentPassword,
        String newPassword,
        String confirmPassword
) {}
