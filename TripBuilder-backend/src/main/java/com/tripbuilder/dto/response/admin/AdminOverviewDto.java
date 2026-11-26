package com.tripbuilder.dto.response.admin;

public record AdminOverviewDto(
        long totalRevenue,
        long collectedDeposit,
        long totalBookings,
        long waitingRequoteBookings,
        long requotedBookings,
        long confirmedBookings,
        long completedBookings,
        long cancelledBookings,
        long totalTours,
        long totalCustomers,
        long totalGuides,
        long totalRegions,
        long totalPresetOptions,
        long pendingGuideApplications
) {}
