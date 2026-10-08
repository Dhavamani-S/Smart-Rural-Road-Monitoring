package com.smartroad.backend.dto;

import com.smartroad.backend.entity.ExpenseCategory;
import com.smartroad.backend.entity.ProjectStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public record DashboardResponse(
        Summary summary,
        Map<ProjectStatus, Long> statusDistribution,
        List<ProjectRow> projects,
        Map<ExpenseCategory, BigDecimal> expenseDistribution,
        List<ProgressSeries> progressTimeline,
        List<RecentUpdate> recentUpdates,
        List<PendingMilestone> pendingMilestones,
        List<AlertResponse> alerts,
        List<RecommendationResponse> recommendations,
        LocalDate generatedOn) {

    public record Summary(
            int totalProjects,
            int notStarted,
            int inProgress,
            int completed,
            int delayed,
            int onHold,
            BigDecimal totalBudget,
            BigDecimal totalExpenditure,
            BigDecimal remainingBudget,
            double budgetUtilizationPercent,
            int projectsRequiringAttention,
            int highRiskProjects) {
    }

    public record ProjectRow(
            Long projectId,
            String name,
            String location,
            ProjectStatus status,
            LocalDate deadline,
            String assignedEngineerName,
            int completedPercentage,
            double plannedProgress,
            BigDecimal totalBudget,
            BigDecimal totalExpenditure,
            BigDecimal remainingBudget,
            double budgetUtilizationPercent,
            double healthIndex,
            String healthCategory) {
    }

    public record Point(LocalDate date, int percentage) {
    }

    public record ProgressSeries(Long projectId, String projectName, List<Point> points) {
    }

    public record RecentUpdate(
            Long projectId,
            String projectName,
            int completedPercentage,
            String remarks,
            LocalDate updateDate,
            String updatedByName) {
    }

    public record PendingMilestone(
            Long milestoneId,
            Long projectId,
            String projectName,
            String title,
            LocalDate targetDate,
            boolean overdue) {
    }
}