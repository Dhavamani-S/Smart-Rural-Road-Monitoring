package com.smartroad.backend.dto;

import com.smartroad.backend.entity.ProgressUpdate;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ProgressResponse(
        Long id,
        Long projectId,
        int completedPercentage,
        String remarks,
        LocalDate updateDate,
        Long updatedById,
        String updatedByName,
        LocalDateTime createdAt) {

    public static ProgressResponse from(ProgressUpdate u) {
        return new ProgressResponse(u.getId(), u.getProject().getId(), u.getCompletedPercentage(),
                u.getRemarks(), u.getUpdateDate(), u.getUpdatedBy().getId(),
                u.getUpdatedBy().getFullName(), u.getCreatedAt());
    }
}