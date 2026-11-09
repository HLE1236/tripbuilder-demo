package com.tripbuilder.region;

import jakarta.persistence.*;
import lombok.*;

/** Khu vực / điểm đến mà Tour Guide phụ trách (Hạ Long, Đà Lạt, Hội An...). */
@Entity
@Table(name = "regions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Region {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String province;

    @Column(length = 500)
    private String description;

    @Column(length = 500)
    private String imageUrl;

    /** Nhãn nổi bật hiển thị trên card, ví dụ "Biển đảo", "Núi rừng". */
    @Column(length = 50)
    private String tag;

    private Double rating;

    private Integer sortOrder;
}
