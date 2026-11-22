package com.tripbuilder.dto.request.booking;

import java.util.List;

public record RequoteRequest(
        Integer days,
        Integer guests,
        Long groupAdjustment,
        String guideNote,
        List<BookingStepRequest> steps
) {}
