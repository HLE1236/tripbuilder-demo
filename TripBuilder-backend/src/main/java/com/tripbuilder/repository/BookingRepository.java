package com.tripbuilder.repository;

import com.tripbuilder.entity.booking.Booking;

import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {

    List<Booking> findAllByOrderByUpdatedAtDesc();

    List<Booking> findByCustomerIdOrderByUpdatedAtDesc(Long customerId);

    List<Booking> findByGuideIdOrderByUpdatedAtDesc(Long guideId);

    boolean existsByTourId(Long tourId);

    boolean existsByCustomerIdOrGuideId(Long customerId, Long guideId);

    Optional<Booking> findFirstByCustomerIdAndTourIdAndStartDateAndDaysAndGuestsAndCreatedAtAfterOrderByIdDesc(
            Long customerId,
            Long tourId,
            LocalDate startDate,
            Integer days,
            Integer guests,
            LocalDateTime after
    );
}
