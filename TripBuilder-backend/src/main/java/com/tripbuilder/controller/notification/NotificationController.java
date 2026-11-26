package com.tripbuilder.controller.notification;

import com.tripbuilder.dto.response.ApiResponse;
import com.tripbuilder.dto.response.notification.NotificationDto;
import com.tripbuilder.dto.response.notification.NotificationListDto;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.security.AuthInterceptor;
import com.tripbuilder.service.notification.NotificationService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<NotificationListDto> list(HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        return ApiResponse.ok(notificationService.getMyNotifications(user.getId()));
    }

    @PostMapping("/{id}/read")
    public ApiResponse<NotificationDto> markRead(@PathVariable Long id, HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        return ApiResponse.ok("Đã đánh dấu đã đọc", notificationService.markAsRead(id, user.getId()));
    }

    @PostMapping("/read-all")
    public ApiResponse<Void> markAllRead(HttpServletRequest request) {
        AppUser user = AuthInterceptor.requireCurrentUser(request);
        notificationService.markAllAsRead(user.getId());
        return ApiResponse.ok("Đã đánh dấu tất cả là đã đọc", null);
    }
}
