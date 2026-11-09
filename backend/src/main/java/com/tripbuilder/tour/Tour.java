package com.tripbuilder.tour;

import com.tripbuilder.region.Region;
import com.tripbuilder.user.AppUser;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Tour Preset do Tour Guide đăng (có thể chỉnh sửa lại).
 * Lịch trình gồm các mốc hoạt động tự nhiên theo ngày (steps).
 * Giá gốc / 1 người = tổng giá của các mốc hoạt động trong lịch trình.
 */
@Entity
@Table(name = "tours")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private AppUser guide;

    @ManyToOne(optional = false)
    private Region region;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(length = 500)
    private String imageUrl;

    @Column(name = "num_days", nullable = false)
    private Integer days;

    /** Tổng giá trọn gói gốc / 1 khách (VNĐ). */
    @Column(nullable = false)
    private Long basePricePerPerson;

    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC, sortOrder ASC, id ASC")
    @Builder.Default
    private List<TourStep> steps = new ArrayList<>();
}
