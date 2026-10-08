package com.smartroad.backend.dto;

import com.smartroad.backend.entity.User;

public record UserResponse(Long id, String fullName, String email, String role, boolean active) {
    public static UserResponse from(User u) {
        return new UserResponse(u.getId(), u.getFullName(), u.getEmail(), u.getRole().name(), u.isActive());
    }
}