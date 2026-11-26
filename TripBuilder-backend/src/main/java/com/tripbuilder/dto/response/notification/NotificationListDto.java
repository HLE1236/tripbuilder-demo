package com.tripbuilder.dto.response.notification;

import java.util.List;

public record NotificationListDto(
        long unreadCount,
        List<NotificationDto> items
) {}
