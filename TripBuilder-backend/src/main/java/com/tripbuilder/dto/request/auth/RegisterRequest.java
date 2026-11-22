package com.tripbuilder.dto.request.auth;

public record RegisterRequest(
        String fullName,
        String email,
        String password,
        String phone
) {}
