package com.tripbuilder.dto.response.booking;

import com.tripbuilder.dto.response.tour.TourDto;
import com.tripbuilder.dto.response.user.UserDto;
import com.tripbuilder.entity.booking.BookingStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record BookingDto(
        Long id,
        String code,
        BookingStatus status,
        String statusLabel,
        int stepIndex,
        TourDto tour,
        String tourTitleSnapshot,
        int tourVersionSnapshot,
        int latestTourVersion,
        UserDto customer,
        UserDto guide,
        LocalDate startDate,
        int days,
        int guests,
        String serviceMode,
        String customerNote,
        String guideNote,
        Integer customerRating,
        String customerReview,
        long originalPricePerPerson,
        long originalTotalPrice,
        long currentPricePerPerson,
        long groupAdjustment,
        long totalPrice,
        Long confirmedTotalPrice,
        int revisionCount,
        boolean postConfirmAdjustment,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<BookingStepDto> steps,
        List<BookingRevisionDto> revisions
) {}
