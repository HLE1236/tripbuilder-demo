package com.tripbuilder.dto.request.guide;

public record LookupGuideApplicationRequest(
        String email,
        String applicationCode
) {}
