package com.tripbuilder.dto.response.system;

public record HelloResponse(
        String status,
        String databaseProduct,
        String databaseVersion,
        String databaseName,
        long regionCount,
        long latencyMs,
        String serverTime
) {}
