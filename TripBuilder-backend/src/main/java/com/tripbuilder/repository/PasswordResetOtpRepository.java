package com.tripbuilder.repository;

import com.tripbuilder.entity.auth.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {

    Optional<PasswordResetOtp> findTopByEmailIgnoreCaseAndUsedFalseOrderByCreatedAtDesc(String email);

    @Modifying
    @Query("UPDATE PasswordResetOtp o SET o.used = true WHERE LOWER(o.email) = LOWER(:email) AND o.used = false")
    int invalidateUnusedByEmail(@Param("email") String email);
}
