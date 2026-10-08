package com.smartroad.backend.dto;

import com.smartroad.backend.entity.ProjectStatus;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ProjectRequest(
        @NotBlank(message = "Project name is required") String name,
        @NotBlank(message = "Location is required") String location,
        @Size(max = 2000, message = "Description must be at most 2000 characters") String description,
        @NotNull(message = "Total budget is required")
        @DecimalMin(value = "0.01", message = "Budget must be greater than zero") BigDecimal totalBudget,
        @NotNull(message = "Start date is required") LocalDate startDate,
        @NotNull(message = "Deadline is required") LocalDate deadline,
        ProjectStatus status,
        Long assignedEngineerId) {
}