package com.tripbuilder.tour;

import com.tripbuilder.auth.AuthInterceptor;
import com.tripbuilder.common.ApiResponse;
import com.tripbuilder.common.ForbiddenException;
import com.tripbuilder.tour.TourService.SaveTourRequest;
import com.tripbuilder.tour.TourService.TourDto;
import com.tripbuilder.user.AppUser;
import com.tripbuilder.user.Role;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tours")
@RequiredArgsConstructor
public class TourController {

    private final TourService tourService;

    @GetMapping
    public ApiResponse<List<TourDto>> list(
            @RequestParam(required = false) Long guideId,
            @RequestParam(required = false) Long regionId,
            @RequestParam(required = false) Integer minDays,
            @RequestParam(required = false) Integer maxDays,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort) {
        return ApiResponse.ok(tourService.list(guideId, regionId, minDays, maxDays, q, sort));
    }

    @GetMapping("/{id}")
    public ApiResponse<TourDto> get(@PathVariable Long id) {
        return ApiResponse.ok(tourService.get(id));
    }

    /** Chỉ Tour Guide được đăng Tour Preset mới. */
    @PostMapping
    public ApiResponse<TourDto> create(@RequestBody SaveTourRequest req, HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.GUIDE) {
            throw new ForbiddenException("Chỉ tài khoản Tour Guide mới được đăng tour mẫu");
        }
        SaveTourRequest scoped = new SaveTourRequest(
                user.getId(),
                req.regionId(),
                req.title(),
                req.description(),
                req.imageUrl(),
                req.galleryUrls(),
                req.days(),
                req.steps()
        );
        return ApiResponse.ok("Đã đăng tour thành công", tourService.create(scoped));
    }

    /** Chỉ Tour Guide sở hữu tour được chỉnh sửa (nâng version, không ảnh hưởng đơn đã đặt). */
    @PutMapping("/{id}")
    public ApiResponse<TourDto> update(@PathVariable Long id,
                                       @RequestBody SaveTourRequest req,
                                       HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.GUIDE) {
            throw new ForbiddenException("Chỉ tài khoản Tour Guide mới được sửa tour mẫu");
        }
        return ApiResponse.ok("Đã cập nhật tour mẫu (phiên bản mới)", tourService.update(id, req, user));
    }
}
