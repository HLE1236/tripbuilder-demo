package com.tripbuilder.user;

public record UserDto(
        Long id,
        String fullName,
        Role role,
        String email,
        String phone,
        String avatarUrl,
        String bio,
        Integer yearsExperience,
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
                u.getRegion() != null ? u.getRegion().getName() : null
        );
    }
}
