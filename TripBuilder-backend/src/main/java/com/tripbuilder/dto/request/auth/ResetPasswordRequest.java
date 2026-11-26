package com.tripbuilder.dto.request.auth;

public record ResetPasswordRequest(
        String email,
        String otp,
        String newPassword,
        String confirmPassword
) {}
