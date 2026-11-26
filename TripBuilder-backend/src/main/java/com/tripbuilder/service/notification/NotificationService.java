package com.tripbuilder.service.notification;

import com.tripbuilder.dto.response.notification.NotificationDto;
import com.tripbuilder.dto.response.notification.NotificationListDto;
import com.tripbuilder.entity.notification.Notification;
import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.exception.BadRequestException;
import com.tripbuilder.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public NotificationListDto getMyNotifications(Long userId) {
        List<NotificationDto> items = notificationRepository
                .findTop30ByRecipientIdOrderByCreatedAtDescIdDesc(userId)
                .stream()
                .map(NotificationDto::from)
                .toList();
        long unread = notificationRepository.countByRecipientIdAndReadFalse(userId);
        return new NotificationListDto(unread, items);
    }

    @Transactional
    public NotificationDto markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findByIdAndRecipientId(id, userId)
                .orElseThrow(() -> new BadRequestException("Không tìm thấy thông báo"));
        if (!Boolean.TRUE.equals(notification.getRead())) {
            notification.setRead(true);
            notificationRepository.save(notification);
        }
        return NotificationDto.from(notification);
    }

    @Transactional
    public void markAllAsRead(Long userId) {
        List<Notification> unread = notificationRepository.findByRecipientIdAndReadFalse(userId);
        if (unread.isEmpty()) return;
        for (Notification n : unread) {
            n.setRead(true);
        }
        notificationRepository.saveAll(unread);
    }

    @Transactional
    public void notify(AppUser recipient, String type, String title, String message, Long relatedBookingId) {
        if (recipient == null || recipient.getId() == null) return;
        String safeTitle = title == null ? "Thông báo" : title.trim();
        if (safeTitle.length() > 150) safeTitle = safeTitle.substring(0, 147) + "...";
        String safeMessage = message == null ? "" : message.trim();
        if (safeMessage.length() > 500) safeMessage = safeMessage.substring(0, 497) + "...";

        notificationRepository.save(Notification.builder()
                .recipient(recipient)
                .type(type)
                .title(safeTitle)
                .message(safeMessage)
                .relatedBookingId(relatedBookingId)
                .read(false)
                .createdAt(LocalDateTime.now())
                .build());
    }
}
