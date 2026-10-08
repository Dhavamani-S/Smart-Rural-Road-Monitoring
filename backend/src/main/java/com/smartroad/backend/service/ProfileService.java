package com.smartroad.backend.service;

import com.smartroad.backend.dto.UserResponse;
import com.smartroad.backend.entity.User;
import com.smartroad.backend.exception.BadRequestException;
import com.smartroad.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserResponse me(String email) {
        return UserResponse.from(userRepository.findByEmail(email).orElseThrow());
    }

    @Transactional
    public void changePassword(String email, String currentPassword, String newPassword) {
        User user = userRepository.findByEmail(email).orElseThrow();
        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new BadRequestException("Current password is incorrect");
        }
        if (passwordEncoder.matches(newPassword, user.getPassword())) {
            throw new BadRequestException("New password must be different from the current password");
        }
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }
}