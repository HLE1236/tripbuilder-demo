package com.tripbuilder.user;

import com.tripbuilder.common.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Danh sách tài khoản mẫu để chọn nhanh khi demo (không cần mật khẩu). */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;

    @GetMapping
    public ApiResponse<List<UserDto>> getByRole(@RequestParam Role role) {
        return ApiResponse.ok(userRepository.findByRoleOrderByIdAsc(role)
                .stream().map(UserDto::from).toList());
    }
}
