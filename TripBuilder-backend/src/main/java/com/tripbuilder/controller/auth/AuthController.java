package com.tripbuilder.controller.auth;

import com.tripbuilder.dto.request.auth.LoginRequest;
import com.tripbuilder.dto.request.auth.RegisterRequest;
import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.dto.response.auth.AuthResponse;
import com.tripbuilder.dto.response.auth.DemoAccountDto;
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

    @GetMapping("/me")
    public ApiResponse<UserDto> me(HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        return ApiResponse.ok(UserDto.from(user));
    }

    @GetMapping("/demo-accounts")
    public ApiResponse<List<DemoAccountDto>> demoAccounts(@RequestParam Role role) {
        return ApiResponse.ok(authService.listDemoAccounts(role));
    }
}
