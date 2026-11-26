package com.tripbuilder.entity.auth;

import com.tripbuilder.entity.user.AppUser;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** Refresh token lưu dưới dạng SHA-256 hex hash để hỗ trợ làm mới phiên và đăng xuất. */
@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 128)
    private String tokenHash;

    @ManyToOne(optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private AppUser user;

    @Builder.Default
    @Column(nullable = false)
    private boolean rememberMe = false;

    @Column(nullable = false)
    private Instant expiresAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean revoked = false;

    @Column(nullable = false)
    private Instant createdAt;
}
