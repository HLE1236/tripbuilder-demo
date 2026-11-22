package com.tripbuilder.entity.booking;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "booking_steps")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingStep {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Booking booking;

    @Column(nullable = false)
    private Integer dayNumber;

    @Column(length = 50)
    private String category;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(length = 500)
    private String imageUrl;

    @Column(nullable = false)
    private Long pricePerPerson;

    @Column(length = 300)
    private String originalTitle;

    private Long originalPricePerPerson;

    @Column(length = 20)
    private String noteType;

    private Integer sortOrder;
}
