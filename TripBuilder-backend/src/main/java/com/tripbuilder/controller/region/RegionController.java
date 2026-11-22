package com.tripbuilder.controller.region;

import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.dto.response.region.PhotoItemDto;
import com.tripbuilder.dto.response.region.RegionDto;
import com.tripbuilder.service.region.RegionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** API đọc danh sách khu vực / điểm đến và kho ảnh địa danh từ database. */
@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class RegionController {

    private final RegionService regionService;

    @GetMapping
    public ApiResponse<List<RegionDto>> getAll() {
        return ApiResponse.ok(regionService.getAll());
    }

    @GetMapping("/{id}/photos")
    public ApiResponse<List<PhotoItemDto>> getRegionPhotos(
            @PathVariable Long id,
            @RequestParam(required = false) String category) {
        return ApiResponse.ok(regionService.getRegionPhotos(id, category));
    }

    @GetMapping("/photos")
    public ApiResponse<List<PhotoItemDto>> getAllPhotos(@RequestParam(required = false) String category) {
        return ApiResponse.ok(regionService.getAllPhotos(category));
    }
}
