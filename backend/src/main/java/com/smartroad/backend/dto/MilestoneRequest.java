package com.smartroad.backend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record MilestoneRequest(
        @NotBlank(message = "Milestone title is required") String title,
        @NotNull(message = "Target date is required") LocalDate targetDate) {
}