package com.tripbuilder.user;

import com.tripbuilder.region.Region;
import jakarta.persistence.*;
import lombok.*;

/** Người dùng: khách hàng hoặc tour guide. Bản demo chưa có mật khẩu. */
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
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(length = 100)
    private String email;

    @Column(length = 20)
    private String phone;

    /** Giới thiệu ngắn (dùng cho guide). */
    @Column(length = 500)
    private String bio;

    /** Số năm kinh nghiệm (dùng cho guide). */
    private Integer yearsExperience;

    /** Khu vực guide hoạt động chính (null với khách hàng). */
    @ManyToOne
    private Region region;
}
