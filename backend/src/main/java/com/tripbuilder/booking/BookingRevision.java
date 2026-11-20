package com.tripbuilder.booking;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "booking_revisions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingRevision {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    private Booking booking;

    private Integer roundNo;

    @Column(length = 20)
    private String actorRole;

    @Column(length = 100)
    private String actorName;

    @Column(length = 120)
    private String actionLabel;

    @Column(length = 1500)
    private String note;

    private Long totalPrice;

    private LocalDateTime createdAt;
}
