package com.tripbuilder.repository;

import com.tripbuilder.entity.user.AppUser;
import com.tripbuilder.entity.user.Role;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {

    List<AppUser> findByRoleOrderByIdAsc(Role role);

    List<AppUser> findByRoleAndDemoAccountTrueOrderByIdAsc(Role role);

    Optional<AppUser> findByEmailIgnoreCase(String email);
}
