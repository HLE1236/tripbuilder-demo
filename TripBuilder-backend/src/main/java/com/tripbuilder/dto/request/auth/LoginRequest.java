package com.tripbuilder.dto.request.auth;

import com.tripbuilder.entity.user.Role;

public record LoginRequest(
        String email,
        String password,
        Role expectedRole,
        Boolean rememberMe
) {}
