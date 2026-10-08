package com.smartroad.backend.dto;

/** engineerId = null removes the current assignment. */
public record AssignmentRequest(Long engineerId) {
}