package com.smartroad.backend.dto;

import com.smartroad.backend.entity.Project;
import com.smartroad.backend.entity.ProjectStatus;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ProjectResponse(
        Long id,
        String name,
        String location,
        String description,
        BigDecimal totalBudget,
        BigDecimal totalExpenditure,
        BigDecimal remainingBudget,
        double budgetUtilizationPercent,
        LocalDate startDate,
        LocalDate deadline,
        ProjectStatus status,
        int completedPercentage,
        Long assignedEngineerId,
        String assignedEngineerName,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static ProjectResponse from(Project p) {
        BigDecimal remaining = p.getTotalBudget().subtract(p.getTotalExpenditure());
        double utilization = 0;
        if (p.getTotalBudget().signum() > 0) {
            utilization = p.getTotalExpenditure().multiply(BigDecimal.valueOf(100))
                    .divide(p.getTotalBudget(), 2, RoundingMode.HALF_UP).doubleValue();
        }
        return new ProjectResponse(
                p.getId(), p.getName(), p.getLocation(), p.getDescription(),
                p.getTotalBudget(), p.getTotalExpenditure(), remaining, utilization,
                p.getStartDate(), p.getDeadline(), p.getStatus(), p.getCompletedPercentage(),
                p.getAssignedEngineer() == null ? null : p.getAssignedEngineer().getId(),
                p.getAssignedEngineer() == null ? null : p.getAssignedEngineer().getFullName(),
                p.getCreatedAt(), p.getUpdatedAt());
    }
}