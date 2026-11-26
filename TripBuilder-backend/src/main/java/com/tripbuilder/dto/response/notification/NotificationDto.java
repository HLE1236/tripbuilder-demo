package com.tripbuilder.dto.response.notification;

import com.tripbuilder.entity.notification.Notification;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        String title,
        String message,
        String type,
        Long relatedBookingId,
        boolean read,
        LocalDateTime createdAt
) {
    public static NotificationDto from(Notification n) {
        return new NotificationDto(
                n.getId(),
                n.getTitle(),
                n.getMessage(),
                n.getType(),
                n.getRelatedBookingId(),
                Boolean.TRUE.equals(n.getRead()),
                n.getCreatedAt()
        );
    }
}
