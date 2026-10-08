package com.smartroad.backend.analytics;

import java.util.List;

public record EvaluationInput(
        String projectName,
        ProjectMetrics metrics,
        List<String> overdueMilestones,
        List<ExpenseEntry> expenses) {
}