package com.tripbuilder.dto.request.booking;

import java.time.LocalDate;
import java.util.List;

public record CustomizeRequest(
        LocalDate startDate,
        Integer days,
        Integer guests,
        String serviceMode,
        String customerNote,
        List<BookingStepRequest> steps
) {}
