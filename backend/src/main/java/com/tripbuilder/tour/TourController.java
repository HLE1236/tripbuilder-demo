package com.tripbuilder.tour;

import com.tripbuilder.common.ApiResponse;
import com.tripbuilder.tour.TourService.SaveTourRequest;
import com.tripbuilder.tour.TourService.TourDto;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tours")
@RequiredArgsConstructor
public class TourController {

    private final TourService tourService;

    @GetMapping
    public ApiResponse<List<TourDto>> list(@RequestParam(required = false) Long guideId) {
        return ApiResponse.ok(tourService.list(guideId));
    }

    @GetMapping("/{id}")
    public ApiResponse<TourDto> get(@PathVariable Long id) {
        return ApiResponse.ok(tourService.get(id));
    }

    /** Guide đăng Tour Preset mới. */
    @PostMapping
    public ApiResponse<TourDto> create(@RequestBody SaveTourRequest req) {
        return ApiResponse.ok("Đã đăng tour thành công", tourService.create(req));
    }

    /** Guide chỉnh sửa lại Tour Preset đã đăng. */
    @PutMapping("/{id}")
    public ApiResponse<TourDto> update(@PathVariable Long id, @RequestBody SaveTourRequest req) {
        return ApiResponse.ok("Đã cập nhật tour preset", tourService.update(id, req));
    }
}
