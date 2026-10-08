package com.smartroad.backend.dto;

import jakarta.validation.constraints.NotNull;

public record ActiveRequest(
        @NotNull(message = "Active flag is required") Boolean active) {
}