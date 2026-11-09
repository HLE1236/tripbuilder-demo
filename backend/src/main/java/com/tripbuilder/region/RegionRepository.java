package com.tripbuilder.region;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegionRepository extends JpaRepository<Region, Long> {

    List<Region> findAllByOrderBySortOrderAsc();

    Optional<Region> findByCode(String code);
}
