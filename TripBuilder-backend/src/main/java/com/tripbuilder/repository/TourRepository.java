package com.tripbuilder.repository;

import com.tripbuilder.entity.tour.Tour;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TourRepository extends JpaRepository<Tour, Long> {

    List<Tour> findAllByOrderByIdDesc();

    List<Tour> findByGuideIdOrderByIdDesc(Long guideId);

    boolean existsByGuideId(Long guideId);
}
