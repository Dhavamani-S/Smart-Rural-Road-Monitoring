package com.smartroad.backend.dto;

import com.smartroad.backend.entity.Milestone;

import java.time.LocalDate;

public record MilestoneResponse(
        Long id,
        Long projectId,
        String title,
        LocalDate targetDate,
        boolean completed,
        LocalDate completedDate) {

    public static MilestoneResponse from(Milestone m) {
        return new MilestoneResponse(m.getId(), m.getProject().getId(), m.getTitle(),
                m.getTargetDate(), m.isCompleted(), m.getCompletedDate());
    }
}