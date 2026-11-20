package com.tripbuilder.region;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface RegionPhotoRepository extends JpaRepository<RegionPhoto, Long> {

    List<RegionPhoto> findAllByOrderBySortOrderAscIdAsc();

    List<RegionPhoto> findByRegionIdOrderBySortOrderAscIdAsc(Long regionId);

    List<RegionPhoto> findByRegionIdAndCategoryOrderBySortOrderAscIdAsc(Long regionId, String category);

    List<RegionPhoto> findByCategoryOrderBySortOrderAscIdAsc(String category);

    Optional<RegionPhoto> findByUrl(String url);
}
