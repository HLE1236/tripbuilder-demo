package com.tripbuilder.auth;

import com.tripbuilder.auth.AuthService.AuthResponse;
import com.tripbuilder.auth.AuthService.DemoAccountDto;
import com.tripbuilder.auth.AuthService.LoginRequest;
import com.tripbuilder.common.ApiResponse;
import com.tripbuilder.user.AppUser;
import com.tripbuilder.user.Role;
import com.tripbuilder.user.UserDto;
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
