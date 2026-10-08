package com.smartroad.backend.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record ProgressRequest(
        @NotNull(message = "Completed percentage is required")
        @Min(value = 0, message = "Completed percentage must be between 0 and 100")
        @Max(value = 100, message = "Completed percentage must be between 0 and 100") Integer completedPercentage,
        @Size(max = 1000, message = "Remarks must be at most 1000 characters") String remarks,
        LocalDate updateDate) {
}