package com.tripbuilder.repository;

import com.tripbuilder.entity.guide.GuideApplication;
import com.tripbuilder.entity.guide.GuideApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GuideApplicationRepository extends JpaRepository<GuideApplication, Long> {

    List<GuideApplication> findAllByOrderByCreatedAtDescIdDesc();

    List<GuideApplication> findByStatusOrderByCreatedAtDescIdDesc(GuideApplicationStatus status);

    Optional<GuideApplication> findFirstByEmailIgnoreCaseOrderByCreatedAtDescIdDesc(String email);

    Optional<GuideApplication> findByEmailIgnoreCaseAndApplicationCodeIgnoreCase(String email, String applicationCode);

    boolean existsByEmailIgnoreCaseAndStatus(String email, GuideApplicationStatus status);

    boolean existsByApplicationCodeIgnoreCase(String applicationCode);

    long countByStatus(GuideApplicationStatus status);
}
