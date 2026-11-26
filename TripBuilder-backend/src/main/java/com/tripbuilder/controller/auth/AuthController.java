package com.tripbuilder.controller.auth;

import com.tripbuilder.dto.request.auth.*;
import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.dto.response.auth.AuthResponse;
import com.tripbuilder.dto.response.auth.DemoAccountDto;
import com.tripbuilder.dto.response.auth.ForgotPasswordResponse;
import com.tripbuilder.dto.response.user.UserDto;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.security.AuthInterceptor;
import com.tripbuilder.service.auth.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@RequestBody LoginRequest req) {
        return ApiResponse.ok("Đăng nhập thành công", authService.login(req));
    }

    @PostMapping("/register")
    public ApiResponse<AuthResponse> register(@RequestBody RegisterRequest req) {
        return ApiResponse.ok("Đăng ký tài khoản thành công", authService.register(req));
    }

    @PostMapping("/refresh")
    public ApiResponse<AuthResponse> refresh(@RequestBody RefreshTokenRequest req) {
        return ApiResponse.ok("Làm mới phiên đăng nhập thành công", authService.refresh(req));
    }

    @PostMapping("/logout")
    public ApiResponse<Void> logout(@RequestBody(required = false) LogoutRequest req, HttpServletRequest request) {
        authService.logout(req, request.getHeader("Authorization"));
        return ApiResponse.ok("Đăng xuất thành công", null);
    }

    @PostMapping("/forgot-password")
    public ApiResponse<ForgotPasswordResponse> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        ForgotPasswordResponse res = authService.forgotPassword(req);
        return ApiResponse.ok(res.message(), res);
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ApiResponse.ok("Đặt lại mật khẩu thành công", null);
    }

    @GetMapping("/me")
    public ApiResponse<UserDto> me(HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        return ApiResponse.ok(UserDto.from(user));
    }

    @PutMapping("/profile")
    public ApiResponse<UserDto> updateProfile(HttpServletRequest request, @RequestBody UpdateProfileRequest req) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        return ApiResponse.ok("Cập nhật thông tin cá nhân thành công", authService.updateProfile(user, req));
    }

    @PostMapping("/change-password")
    public ApiResponse<Void> changePassword(HttpServletRequest request, @RequestBody ChangePasswordRequest req) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        authService.changePassword(user, req);
        return ApiResponse.ok("Đổi mật khẩu thành công", null);
    }

    @GetMapping("/demo-accounts")
    public ApiResponse<List<DemoAccountDto>> demoAccounts(@RequestParam Role role) {
        return ApiResponse.ok(authService.listDemoAccounts(role));
    }
}
