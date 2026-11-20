package com.tripbuilder.user;

import com.tripbuilder.auth.AuthService;
import com.tripbuilder.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Danh sách tài khoản mẫu để chọn nhanh khi demo (không lộ thông tin nhạy cảm). */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final AuthService authService;

    @GetMapping
    public ApiResponse<List<AuthService.DemoAccountDto>> getByRole(@RequestParam Role role) {
        return ApiResponse.ok(authService.listDemoAccounts(role));
    }
}
