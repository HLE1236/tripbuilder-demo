package com.tripbuilder.entity.auth;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

/** Mã OTP đặt lại mật khẩu (lưu dưới dạng SHA-256 hex hash, hiệu lực 10 phút). */
@Entity
@Table(name = "password_reset_otps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetOtp {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 128)
    private String otpHash;

    @Column(nullable = false)
    private Instant expiresAt;

    @Builder.Default
    @Column(nullable = false)
    private boolean used = false;

    @Builder.Default
    @Column(nullable = false)
    private int attempts = 0;

    @Column(nullable = false)
    private Instant createdAt;
}
