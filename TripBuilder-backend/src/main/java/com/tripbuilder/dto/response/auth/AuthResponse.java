package com.tripbuilder.dto.response.auth;

import com.tripbuilder.dto.response.user.UserDto;

public record AuthResponse(
        String token,
        String refreshToken,
        long expiresInSeconds,
        UserDto user
) {}
