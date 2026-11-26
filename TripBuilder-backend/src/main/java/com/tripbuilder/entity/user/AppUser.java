package com.tripbuilder.entity.user;

import com.tripbuilder.entity.tour.Tour;

import com.tripbuilder.entity.region.Region;
import jakarta.persistence.*;
import lombok.*;

/** Người dùng: khách hàng hoặc tour guide (quản trị viên tour). */
@Entity
@Table(name = "app_users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Enumerated(EnumType.STRING)
    @org.hibernate.annotations.JdbcTypeCode(org.hibernate.type.SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(length = 100, unique = true)
    private String email;

    @Column(length = 128)
    private String passwordHash;

    @Column(length = 20)
    private String phone;

    @Column(length = 500)
    private String avatarUrl;

    /** Giới thiệu ngắn (dùng cho guide). */
    @Column(length = 500)
    private String bio;

    /** Số năm kinh nghiệm (dùng cho guide). */
    private Integer yearsExperience;

    /** Khu vực guide hoạt động chính (null với khách hàng). */
    @ManyToOne
    private Region region;

    /** Đánh dấu tài khoản mẫu phục vụ chọn nhanh trên màn Login. */
    @Builder.Default
    @Column(nullable = false)
    private boolean demoAccount = false;

    /** Phiên bản token để vô hiệu hóa toàn bộ access token cũ khi logout hoặc đổi/reset mật khẩu. */
    @Builder.Default
    private Long tokenVersion = 0L;
}
