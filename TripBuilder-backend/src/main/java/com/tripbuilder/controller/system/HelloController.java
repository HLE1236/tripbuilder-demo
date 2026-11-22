package com.tripbuilder.controller.system;

import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.dto.response.system.HelloResponse;
import com.tripbuilder.service.region.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.time.OffsetDateTime;

/**
 * Endpoint "Hello World" cho demo kỹ thuật tuần 2:
 * React → REST API (Spring Boot) → truy vấn Database → trả kết quả.
 */
@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HelloController {

    private final DataSource dataSource;
    private final RegionService regionService;

    @GetMapping("/hello")
    public ApiResponse<HelloResponse> hello() throws Exception {
        long start = System.nanoTime();

        try (Connection conn = dataSource.getConnection()) {
            if (!conn.isValid(2)) {
                throw new IllegalStateException("Database connection is not valid");
            }
        }
        long regionCount = regionService.count();
        long latencyMs = (System.nanoTime() - start) / 1_000_000;

        return ApiResponse.ok("TripBuilder API đang hoạt động", new HelloResponse(
                "UP",
                "CONNECTED",
                null,
                null,
                regionCount,
                latencyMs,
                OffsetDateTime.now().toString()
        ));
    }
}
