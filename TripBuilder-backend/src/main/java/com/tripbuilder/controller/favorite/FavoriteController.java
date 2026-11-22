package com.tripbuilder.controller.favorite;

import com.tripbuilder.entity.tour.Tour;
import com.tripbuilder.service.favorite.FavoriteService;

import com.tripbuilder.security.AuthInterceptor;
import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.exception.ForbiddenException;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** API lưu / bỏ lưu tour yêu thích cho khách hàng. */
@RestController
@RequestMapping("/api/favorites")
@RequiredArgsConstructor
public class FavoriteController {

    private final FavoriteService favoriteService;

    @GetMapping
    public ApiResponse<List<Long>> list(HttpServletRequest request) {
        AppUser customer = requireCustomer(request);
        return ApiResponse.ok(favoriteService.listIds(customer.getId()));
    }

    @PostMapping("/{tourId}")
    public ApiResponse<List<Long>> save(@PathVariable Long tourId, HttpServletRequest request) {
        AppUser customer = requireCustomer(request);
        return ApiResponse.ok("Đã lưu tour vào danh sách yêu thích", favoriteService.save(customer, tourId));
    }

    @DeleteMapping("/{tourId}")
    public ApiResponse<List<Long>> remove(@PathVariable Long tourId, HttpServletRequest request) {
        AppUser customer = requireCustomer(request);
        return ApiResponse.ok("Đã bỏ lưu tour khỏi danh sách yêu thích", favoriteService.remove(customer.getId(), tourId));
    }

    private static AppUser requireCustomer(HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.CUSTOMER) {
            throw new ForbiddenException("Chỉ tài khoản Khách hàng mới được sử dụng danh sách tour yêu thích");
        }
        return user;
    }
}
