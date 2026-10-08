package com.smartroad.backend.service;

import com.smartroad.backend.dto.UserResponse;
import com.smartroad.backend.entity.Role;
import com.smartroad.backend.entity.User;
import com.smartroad.backend.exception.BadRequestException;
import com.smartroad.backend.exception.ResourceNotFoundException;
import com.smartroad.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserAdminService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<UserResponse> listAll() {
        return userRepository.findAll(Sort.by(Sort.Direction.ASC, "fullName"))
                .stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse setActive(Long userId, boolean active) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id " + userId));
        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Admin accounts cannot be deactivated");
        }
        user.setActive(active);
        return UserResponse.from(userRepository.save(user));
    }
}