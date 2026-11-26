package com.tripbuilder.repository;

import com.tripbuilder.entity.booking.Booking;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Query("SELECT b FROM Booking b WHERE b.guide.id = :guideId AND b.status = com.tripbuilder.entity.booking.BookingStatus.CONFIRMED AND UPPER(COALESCE(b.serviceMode, 'COMPANION')) = 'COMPANION'")
    List<Booking> findActiveCompanionBookingsByGuide(@Param("guideId") Long guideId);

    List<Booking> findByTourIdAndCustomerRatingIsNotNullOrderByUpdatedAtDesc(Long tourId);

    List<Booking> findByCustomerRatingIsNotNullOrderByUpdatedAtDesc();

    Optional<Booking> findFirstByCustomerIdAndTourIdAndStartDateAndDaysAndGuestsAndCreatedAtAfterOrderByIdDesc(
            Long customerId,
            Long tourId,
            LocalDate startDate,
            Integer days,
            Integer guests,
            LocalDateTime after
    );
}
