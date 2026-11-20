package com.tripbuilder.favorite;

import com.tripbuilder.tour.Tour;
import com.tripbuilder.user.AppUser;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/** Tour yêu thích được khách hàng lưu lại. */
@Entity
@Table(
        name = "saved_tours",
        uniqueConstraints = @UniqueConstraint(name = "uk_saved_tours_customer_tour", columnNames = {"customer_id", "tour_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedTour {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private AppUser customer;

    @ManyToOne(optional = false)
    @JoinColumn(name = "tour_id", nullable = false)
    private Tour tour;

    private LocalDateTime createdAt;
}
