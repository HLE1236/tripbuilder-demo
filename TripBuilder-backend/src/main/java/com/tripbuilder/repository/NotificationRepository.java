package com.tripbuilder.repository;

import com.tripbuilder.entity.notification.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findTop30ByRecipientIdOrderByCreatedAtDescIdDesc(Long recipientId);

    long countByRecipientIdAndReadFalse(Long recipientId);

    Optional<Notification> findByIdAndRecipientId(Long id, Long recipientId);

    List<Notification> findByRecipientIdAndReadFalse(Long recipientId);
}
