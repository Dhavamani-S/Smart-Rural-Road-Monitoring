package com.smartroad.backend.dto;

import java.time.LocalDate;
import java.util.List;

public record ProjectReportResponse(
        ProjectResponse project,
        Timeline timeline,
        HealthIndexResponse health,
        BudgetAnalysisResponse budget,
        List<MilestoneResponse> milestones,
        List<ProgressResponse> progressHistory,
        List<ExpenseResponse> expenses,
        List<PhotoResponse> photos,
        List<AlertResponse> alerts,
        List<RecommendationResponse> recommendations,
        LocalDate generatedOn) {

    public record Timeline(
            LocalDate startDate,
            LocalDate deadline,
            long totalDays,
            long elapsedDays,
            long remainingDays,
            double plannedProgress,
            double actualProgress,
            double progressGap) {
    }
}