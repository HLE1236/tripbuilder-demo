package com.tripbuilder.dto.response.auth;

public record ForgotPasswordResponse(
        String message,
        String devOtp
) {}
