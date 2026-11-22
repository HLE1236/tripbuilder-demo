package com.tripbuilder.controller.user;

import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.dto.response.auth.DemoAccountDto;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.service.user.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Danh sách tài khoản mẫu để chọn nhanh khi demo (không lộ thông tin nhạy cảm). */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping
    public ApiResponse<List<DemoAccountDto>> getByRole(@RequestParam Role role) {
        return ApiResponse.ok(userService.listDemoAccounts(role));
    }
}
