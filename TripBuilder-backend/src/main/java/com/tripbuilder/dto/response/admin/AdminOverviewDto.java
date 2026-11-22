package com.tripbuilder.dto.response.admin;

public record AdminOverviewDto(
        long totalRevenue,
        long totalBookings,
        long waitingRequoteBookings,
        long requotedBookings,
        long confirmedBookings,
        long cancelledBookings,
        long totalTours,
        long totalCustomers,
        long totalGuides,
        long totalRegions,
        long totalPresetOptions
) {}
