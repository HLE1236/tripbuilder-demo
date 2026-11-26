package com.tripbuilder.repository;

import com.tripbuilder.entity.guide.GuideApplication;
import com.tripbuilder.entity.guide.GuideApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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

    @Modifying
    @Query("UPDATE GuideApplication g SET g.reviewedBy = null WHERE g.reviewedBy.id = :userId")
    void clearReviewedBy(@Param("userId") Long userId);

    @Modifying
    @Query("UPDATE GuideApplication g SET g.createdUser = null WHERE g.createdUser.id = :userId")
    void clearCreatedUser(@Param("userId") Long userId);
}
