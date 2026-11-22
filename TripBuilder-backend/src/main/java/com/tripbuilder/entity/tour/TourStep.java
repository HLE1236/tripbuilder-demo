package com.tripbuilder.entity.tour;

import jakarta.persistence.*;
import lombok.*;

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

    @Column(length = 500)
    private String imageUrl;

    /** Giá của hạng mục này tính cho 1 người (VNĐ). */
    @Column(nullable = false)
    private Long pricePerPerson;

    private Integer sortOrder;
}
