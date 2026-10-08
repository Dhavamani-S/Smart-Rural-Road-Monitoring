package com.smartroad.backend.analytics;

import com.smartroad.backend.entity.ProjectStatus;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Plain input for the analytics calculators, so they never touch the database. */
public record ProjectMetrics(
        LocalDate today,
        LocalDate startDate,
        LocalDate deadline,
        int completedPercentage,
        ProjectStatus status,
        BigDecimal totalBudget,
        BigDecimal totalExpenditure,
        int overdueMilestones,
        LocalDate lastProgressUpdate) {
}
