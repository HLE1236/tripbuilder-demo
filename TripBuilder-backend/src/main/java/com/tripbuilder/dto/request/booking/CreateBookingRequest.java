package com.tripbuilder.dto.request.booking;

import java.time.LocalDate;
import java.util.List;

public record CreateBookingRequest(
        Long tourId,
        Long customerId,
        LocalDate startDate,
        Integer days,
        Integer guests,
        Integer adults,
        Integer children,
        String serviceMode,
        String customerNote,
        Boolean customized,
        List<BookingStepRequest> steps
) {
    public CreateBookingRequest(
            Long tourId,
            Long customerId,
            LocalDate startDate,
            Integer days,
            Integer guests,
            String serviceMode,
            String customerNote,
            Boolean customized,
            List<BookingStepRequest> steps
    ) {
        this(tourId, customerId, startDate, days, guests, null, null, serviceMode, customerNote, customized, steps);
    }
}
