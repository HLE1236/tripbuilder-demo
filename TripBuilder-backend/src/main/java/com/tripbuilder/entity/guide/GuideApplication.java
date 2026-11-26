package com.tripbuilder.entity.guide;

import com.tripbuilder.entity.region.Region;
import com.tripbuilder.entity.user.AppUser;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

/** Hồ sơ ứng tuyển làm Tour Guide bản địa theo 1 vùng cố định. */
@Entity
@Table(name = "guide_applications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GuideApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 30)
    private String applicationCode;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(nullable = false, length = 128)
    private String passwordHash;

    @ManyToOne(optional = false)
    private Region region;

    private Integer yearsExperience;

    @Column(length = 60)
    private String licenseNumber;

    @Column(length = 200)
    private String languages;

    @Column(nullable = false, length = 1000)
    private String bio;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(nullable = false, length = 20)
    private GuideApplicationStatus status = GuideApplicationStatus.PENDING;

    @Column(length = 500)
    private String reviewNote;

    @ManyToOne
    private AppUser reviewedBy;

    @ManyToOne
    private AppUser createdUser;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime reviewedAt;
}
