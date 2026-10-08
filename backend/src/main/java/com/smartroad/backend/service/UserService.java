package com.smartroad.backend.service;

import com.smartroad.backend.dto.CreateEngineerRequest;
import com.smartroad.backend.dto.UserResponse;
import com.smartroad.backend.entity.Role;
import com.smartroad.backend.entity.User;
import com.smartroad.backend.exception.BadRequestException;
import com.smartroad.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional
    public UserResponse createEngineer(CreateEngineerRequest req) {
        String email = req.email().trim();
        if (userRepository.existsByEmail(email)) {
            throw new BadRequestException("Email is already registered");
        }
        User user = new User();
        user.setFullName(req.fullName().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole(Role.SITE_ENGINEER);
        return UserResponse.from(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listEngineers() {
        return userRepository.findByRole(Role.SITE_ENGINEER).stream().map(UserResponse::from).toList();
    }
}