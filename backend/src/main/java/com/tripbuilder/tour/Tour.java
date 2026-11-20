package com.tripbuilder.tour;

import com.tripbuilder.region.Region;
import com.tripbuilder.user.AppUser;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Tour Preset do Tour Guide đăng (có hỗ trợ version để giữ nguyên snapshot đơn cũ).
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

    /** Danh sách ảnh gallery bổ sung (ngăn cách bằng dấu |). */
    @Column(length = 4000)
    private String galleryImages;

    @Column(name = "num_days", nullable = false)
    private Integer days;

    /** Tổng giá trọn gói gốc / 1 khách (VNĐ). */
    @Column(nullable = false)
    private Long basePricePerPerson;

    /** Phiên bản của Tour Preset (tăng khi Guide chỉnh sửa để phân biệt với đơn cũ). */
    private Integer version;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "tour", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("dayNumber ASC, sortOrder ASC, id ASC")
    @Builder.Default
    private List<TourStep> steps = new ArrayList<>();
}
