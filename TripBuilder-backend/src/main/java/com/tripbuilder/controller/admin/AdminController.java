package com.tripbuilder.controller.admin;

import com.tripbuilder.dto.request.admin.ApproveGuideApplicationRequest;
import com.tripbuilder.dto.request.admin.CreatePresetOptionRequest;
import com.tripbuilder.dto.request.admin.CreateUserRequest;
import com.tripbuilder.dto.request.admin.ReassignGuideRequest;
import com.tripbuilder.dto.request.admin.RejectGuideApplicationRequest;
import com.tripbuilder.dto.request.admin.UpdateUserRequest;
import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.dto.response.admin.AdminOverviewDto;
import com.tripbuilder.dto.response.admin.AdminPresetOptionDto;
import com.tripbuilder.dto.response.booking.BookingDto;
import com.tripbuilder.dto.response.guide.GuideApplicationDto;
import com.tripbuilder.dto.response.tour.TourDto;
import com.tripbuilder.dto.response.user.UserDto;
import com.tripbuilder.entity.guide.GuideApplicationStatus;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.exception.ForbiddenException;
import com.tripbuilder.security.AuthInterceptor;
import com.tripbuilder.service.admin.AdminService;
import com.tripbuilder.service.guide.GuideApplicationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final GuideApplicationService guideApplicationService;

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

    @PutMapping("/users/{id}")
    public ApiResponse<UserDto> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest req,
            HttpServletRequest request) {
        requireAdmin(request);
        return ApiResponse.ok("Đã cập nhật tài khoản", adminService.updateUser(id, req));
    }

    @DeleteMapping("/users/{id}")
    public ApiResponse<Void> deleteUser(@PathVariable Long id, HttpServletRequest request) {
        AppUser admin = requireAdmin(request);
        adminService.deleteUser(id, admin);
        return ApiResponse.ok("Đã xoá tài khoản", null);
    }

    @GetMapping("/tours")
    public ApiResponse<List<TourDto>> listTours(HttpServletRequest request) {
        AppUser admin = requireAdmin(request);
        return ApiResponse.ok(adminService.listTours(admin));
    }

    @GetMapping("/bookings")
    public ApiResponse<List<BookingDto>> listBookings(HttpServletRequest request) {
        requireAdmin(request);
        return ApiResponse.ok(adminService.listBookings());
    }

    @PutMapping("/bookings/{id}/reassign")
    public ApiResponse<BookingDto> reassignBookingGuide(
            @PathVariable Long id,
            @RequestBody ReassignGuideRequest req,
            HttpServletRequest request) {
        AppUser admin = requireAdmin(request);
        return ApiResponse.ok("Đã điều phối lại Tour Guide cho đơn đặt tour",
                adminService.reassignGuide(id, req, admin));
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

    @PutMapping("/preset-options/{id}")
    public ApiResponse<AdminPresetOptionDto> updatePresetOption(
            @PathVariable Long id,
            @RequestBody CreatePresetOptionRequest req,
            HttpServletRequest request) {
        requireAdmin(request);
        return ApiResponse.ok("Đã cập nhật dịch vụ gợi ý", adminService.updatePresetOption(id, req));
    }

    @DeleteMapping("/preset-options/{id}")
    public ApiResponse<Void> deletePresetOption(@PathVariable Long id, HttpServletRequest request) {
        requireAdmin(request);
        adminService.deletePresetOption(id);
        return ApiResponse.ok("Đã xoá dịch vụ gợi ý", null);
    }

    @GetMapping("/guide-applications")
    public ApiResponse<List<GuideApplicationDto>> listGuideApplications(
            @RequestParam(required = false) GuideApplicationStatus status,
            HttpServletRequest request) {
        requireAdmin(request);
        return ApiResponse.ok(guideApplicationService.listForAdmin(status));
    }

    @PostMapping("/guide-applications/{id}/approve")
    public ApiResponse<GuideApplicationDto> approveGuideApplication(
            @PathVariable Long id,
            @RequestBody(required = false) ApproveGuideApplicationRequest req,
            HttpServletRequest request) {
        AppUser admin = requireAdmin(request);
        return ApiResponse.ok("Đã duyệt hồ sơ và cấp tài khoản Tour Guide",
                guideApplicationService.approve(id, req, admin));
    }

    @PostMapping("/guide-applications/{id}/reject")
    public ApiResponse<GuideApplicationDto> rejectGuideApplication(
            @PathVariable Long id,
            @RequestBody RejectGuideApplicationRequest req,
            HttpServletRequest request) {
        AppUser admin = requireAdmin(request);
        return ApiResponse.ok("Đã từ chối hồ sơ đăng ký Tour Guide",
                guideApplicationService.reject(id, req, admin));
    }

    private static AppUser requireAdmin(HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        if (user.getRole() != Role.ADMIN) {
            throw new ForbiddenException("Chỉ tài khoản Admin Tổng mới có quyền truy cập");
        }
        return user;
    }
}
