package com.tripbuilder.region;

import jakarta.persistence.*;
import lombok.*;

/** Ảnh địa danh / trải nghiệm thực tế thuộc khu vực hoặc dùng chung (region == null). */
@Entity
@Table(name = "region_photos")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegionPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = true)
    private Region region;

    @Column(nullable = false, length = 500)
    private String url;

    @Column(length = 200)
    private String landmarkName;

    @Column(length = 500)
    private String caption;

    @Column(length = 50)
    private String category;

    @Column(length = 200)
    private String credit;

    private Integer sortOrder;
}
