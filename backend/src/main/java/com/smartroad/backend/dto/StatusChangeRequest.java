package com.smartroad.backend.dto;

import com.smartroad.backend.entity.ProjectStatus;
import jakarta.validation.constraints.NotNull;

public record StatusChangeRequest(
        @NotNull(message = "Status is required") ProjectStatus status) {
}