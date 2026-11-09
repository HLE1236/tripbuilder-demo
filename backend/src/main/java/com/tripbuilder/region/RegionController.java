package com.tripbuilder.region;

import com.tripbuilder.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** API đọc danh sách khu vực / điểm đến từ database. */
@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class RegionController {

    private final RegionRepository regionRepository;

    @GetMapping
    public ApiResponse<List<RegionDto>> getAll() {
        return ApiResponse.ok(regionRepository.findAllByOrderBySortOrderAsc()
                .stream().map(RegionDto::from).toList());
    }
}
