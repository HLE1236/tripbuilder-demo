package com.tripbuilder.dto.request.auth;

public record RegisterRequest(
        String fullName,
        String email,
        String phone,
        String password,
        String confirmPassword,
        Boolean acceptedTerms
) {}
