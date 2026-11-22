package com.tripbuilder.service.user;

import com.tripbuilder.dto.response.auth.DemoAccountDto;
import com.tripbuilder.entity.user.Role;
import com.tripbuilder.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<DemoAccountDto> listDemoAccounts(Role role) {
        return userRepository.findByRoleOrderByIdAsc(role)
                .stream()
                .map(DemoAccountDto::from)
                .toList();
    }
}
