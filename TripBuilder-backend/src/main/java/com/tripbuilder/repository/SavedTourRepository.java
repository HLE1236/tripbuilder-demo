package com.tripbuilder.repository;

import com.tripbuilder.entity.favorite.SavedTour;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SavedTourRepository extends JpaRepository<SavedTour, Long> {

    List<SavedTour> findByCustomerIdOrderByCreatedAtDesc(Long customerId);

    Optional<SavedTour> findByCustomerIdAndTourId(Long customerId, Long tourId);

    boolean existsByCustomerIdAndTourId(Long customerId, Long tourId);

    void deleteByCustomerIdAndTourId(Long customerId, Long tourId);

    void deleteByTourId(Long tourId);

    void deleteByCustomerId(Long customerId);
}
