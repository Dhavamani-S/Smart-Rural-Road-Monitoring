package com.smartroad.backend.analytics;

import java.util.List;

public record HealthIndexResult(
        double healthIndex,
        HealthCategory category,
        double progressScore,
        double budgetScore,
        double scheduleScore,
        double plannedProgress,
        double actualProgress,
        double weightProgress,
        double weightBudget,
        double weightSchedule,
        List<String> factors,
        List<String> notes) {
}