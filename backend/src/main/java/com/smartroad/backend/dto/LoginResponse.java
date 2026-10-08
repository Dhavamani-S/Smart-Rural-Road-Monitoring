package com.smartroad.backend.dto;

public record LoginResponse(String token, String email, String fullName, String role) {
}