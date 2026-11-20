package com.tripbuilder.user;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<AppUser, Long> {

    List<AppUser> findByRoleOrderByIdAsc(Role role);

    Optional<AppUser> findByEmailIgnoreCase(String email);
}
