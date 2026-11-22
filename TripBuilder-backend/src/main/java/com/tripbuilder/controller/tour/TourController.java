package com.tripbuilder.controller.tour;

import com.tripbuilder.dto.request.tour.SaveTourRequest;
import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.dto.response.tour.TourDto;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.exception.ForbiddenException;
import com.tripbuilder.security.AuthInterceptor;
import com.tripbuilder.service.tour.TourService;
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

    /** Tour Guide sở hữu hoặc Admin được xoá tour mẫu chưa có đơn đặt. */
    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.GUIDE && user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Bạn không có quyền xoá tour mẫu");
        }
        tourService.delete(id, user);
        return ApiResponse.ok("Đã xoá tour mẫu", null);
    }
}
