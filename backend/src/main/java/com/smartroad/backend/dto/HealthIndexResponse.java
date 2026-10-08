package com.smartroad.backend.dto;

import com.smartroad.backend.analytics.HealthCategory;
import com.smartroad.backend.analytics.HealthIndexResult;
import com.smartroad.backend.entity.Project;
import com.smartroad.backend.entity.ProjectStatus;

import java.time.LocalDate;
import java.util.List;

public record HealthIndexResponse(
        Long projectId,
        String projectName,
        ProjectStatus projectStatus,
        double healthIndex,
        HealthCategory category,
        String categoryLabel,
        double progressScore,
        double budgetScore,
        double scheduleScore,
        double plannedProgress,
        double actualProgress,
        double weightProgress,
        double weightBudget,
        double weightSchedule,
        List<String> factors,
        List<String> notes,
        LocalDate lastProgressUpdate,
        LocalDate calculatedOn) {

    public static HealthIndexResponse from(Project p, HealthIndexResult r, LocalDate lastUpdate, LocalDate today) {
        return new HealthIndexResponse(p.getId(), p.getName(), p.getStatus(), r.healthIndex(), r.category(),
                r.category().getLabel(), r.progressScore(), r.budgetScore(), r.scheduleScore(),
                r.plannedProgress(), r.actualProgress(), r.weightProgress(), r.weightBudget(),
                r.weightSchedule(), r.factors(), r.notes(), lastUpdate, today);
    }
}