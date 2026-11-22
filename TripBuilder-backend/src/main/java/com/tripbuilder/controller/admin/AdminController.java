package com.tripbuilder.controller.admin;

import com.tripbuilder.dto.request.admin.CreatePresetOptionRequest;
import com.tripbuilder.dto.request.admin.CreateUserRequest;
import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.dto.response.admin.AdminOverviewDto;
import com.tripbuilder.dto.response.admin.AdminPresetOptionDto;
import com.tripbuilder.dto.response.booking.BookingDto;
import com.tripbuilder.dto.response.tour.TourDto;
import com.tripbuilder.dto.response.user.UserDto;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.exception.ForbiddenException;
import com.tripbuilder.security.AuthInterceptor;
import com.tripbuilder.service.admin.AdminService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/overview")
    public ApiResponse<AdminOverviewDto> overview(HttpServletRequest request) {
        requireAdmin(request);
        return ApiResponse.ok(adminService.getOverview());
    }

    @GetMapping("/users")
    public ApiResponse<List<UserDto>> listUsers(
            @RequestParam(required = false) Role role,
            HttpServletRequest request) {
        requireAdmin(request);
        return ApiResponse.ok(adminService.listUsers(role));
    }

    @PostMapping("/users")
    public ApiResponse<UserDto> createUser(
            @RequestBody CreateUserRequest req,
            HttpServletRequest request) {
        requireAdmin(request);
        return ApiResponse.ok("Đã tạo tài khoản mới", adminService.createUser(req));
    }

    @GetMapping("/tours")
    public ApiResponse<List<TourDto>> listTours(HttpServletRequest request) {
        requireAdmin(request);
        return ApiResponse.ok(adminService.listTours());
    }

    @GetMapping("/bookings")
    public ApiResponse<List<BookingDto>> listBookings(HttpServletRequest request) {
        requireAdmin(request);
        return ApiResponse.ok(adminService.listBookings());
    }

    @GetMapping("/preset-options")
    public ApiResponse<List<AdminPresetOptionDto>> listPresetOptions(HttpServletRequest request) {
        requireAdmin(request);
        return ApiResponse.ok(adminService.listPresetOptions());
    }

    @PostMapping("/preset-options")
    public ApiResponse<AdminPresetOptionDto> createPresetOption(
            @RequestBody CreatePresetOptionRequest req,
            HttpServletRequest request) {
        requireAdmin(request);
        return ApiResponse.ok("Đã thêm dịch vụ gợi ý mới", adminService.createPresetOption(req));
    }

    @DeleteMapping("/preset-options/{id}")
    public ApiResponse<Void> deletePresetOption(@PathVariable Long id, HttpServletRequest request) {
        requireAdmin(request);
        adminService.deletePresetOption(id);
        return ApiResponse.ok("Đã xoá dịch vụ gợi ý", null);
    }

    private static AppUser requireAdmin(HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Chỉ tài khoản Admin Tổng mới có quyền truy cập");
        }
        return user;
    }
}
