package com.tripbuilder.dto.response.auth;

import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;

public record DemoAccountDto(
        Long id,
        String fullName,
        Role role,
        String email,
        String avatarUrl,
        String regionName
) {
    public static DemoAccountDto from(AppUser u) {
        return new DemoAccountDto(
                u.getId(),
                u.getFullName(),
                u.getRole(),
                u.getEmail(),
                u.getAvatarUrl(),
                u.getRegion() != null ? u.getRegion().getName() : null
        );
    }
}
