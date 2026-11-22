package com.tripbuilder.dto.request.admin;

import com.tripbuilder.entity.user.Role;

public record CreateUserRequest(
        String fullName,
        String email,
        String password,
        String phone,
        Role role,
        Long regionId
) {}
