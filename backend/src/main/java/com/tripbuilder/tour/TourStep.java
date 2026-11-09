package com.tripbuilder.tour;

import jakarta.persistence.*;
import lombok.*;

/**
 * Một dòng hoạt động / dịch vụ trong lịch trình chuẩn của Tour Preset.
 * Ví dụ: Ngày 1 | "Khách sạn" | "Nhận phòng KS Mường Thanh 4★ (phòng đôi hướng vịnh)" | 600.000đ/người
 */
@Entity
@Table(name = "tour_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TourStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Tour tour;

    @Column(nullable = false)
    private Integer dayNumber;

    @Column(length = 50)
    private String category;

    @Column(nullable = false, length = 300)
    private String title;

    /** Giá của hạng mục này tính cho 1 người (VNĐ). */
    @Column(nullable = false)
    private Long pricePerPerson;

    private Integer sortOrder;
}
