package com.tripbuilder.entity.notification;

import com.tripbuilder.entity.user.AppUser;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private AppUser recipient;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(length = 50)
    private String type;

    private Long relatedBookingId;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private Boolean read = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
