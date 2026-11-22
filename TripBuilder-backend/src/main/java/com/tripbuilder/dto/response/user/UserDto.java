package com.tripbuilder.dto.response.user;

import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;

public record UserDto(
        Long id,
        String fullName,
        Role role,
        String email,
        String phone,
        String avatarUrl,
        String bio,
        Integer yearsExperience,
        Long regionId,
        String regionName
) {
    public static UserDto from(AppUser u) {
        return new UserDto(
                u.getId(),
                u.getFullName(),
                u.getRole(),
                u.getEmail(),
                u.getPhone(),
                u.getAvatarUrl(),
                u.getBio(),
                u.getYearsExperience(),
                u.getRegion() != null ? u.getRegion().getId() : null,
                u.getRegion() != null ? u.getRegion().getName() : null
        );
    }
}
