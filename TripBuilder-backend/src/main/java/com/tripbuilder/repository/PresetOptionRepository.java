package com.tripbuilder.repository;

import com.tripbuilder.entity.catalog.PresetOption;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PresetOptionRepository extends JpaRepository<PresetOption, Long> {

    List<PresetOption> findByRegionIdOrderByIdAsc(Long regionId);
}
