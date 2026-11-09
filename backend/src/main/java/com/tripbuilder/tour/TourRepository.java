package com.tripbuilder.tour;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TourRepository extends JpaRepository<Tour, Long> {

    List<Tour> findAllByOrderByIdDesc();

    List<Tour> findByGuideIdOrderByIdDesc(Long guideId);
}
