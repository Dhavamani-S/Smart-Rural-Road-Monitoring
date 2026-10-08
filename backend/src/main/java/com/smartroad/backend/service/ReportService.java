package com.smartroad.backend.service;

import com.smartroad.backend.analytics.AnalyticsMath;
import com.smartroad.backend.dto.BudgetAnalysisResponse;
import com.smartroad.backend.dto.HealthIndexResponse;
import com.smartroad.backend.dto.ProjectEvaluationResponse;
import com.smartroad.backend.dto.ProjectReportResponse;
import com.smartroad.backend.dto.ProjectResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

@Service
@RequiredArgsConstructor
public class ReportService {

    private final ProjectService projectService;
    private final AnalyticsService analyticsService;
    private final EvaluationService evaluationService;
    private final MilestoneService milestoneService;
    private final ProgressService progressService;
    private final ExpenseService expenseService;
    private final PhotoService photoService;

    @Transactional
    public ProjectReportResponse build(Long projectId, String email, boolean isAdmin) {
        LocalDate today = LocalDate.now();

        // The first call also performs the 404 / 403 checks for the whole report.
        ProjectResponse project = projectService.get(projectId, email, isAdmin);
        ProjectEvaluationResponse evaluation = evaluationService.evaluate(projectId, email, isAdmin);
        HealthIndexResponse health = analyticsService.health(projectId, email, isAdmin);
        BudgetAnalysisResponse budget = analyticsService.budget(projectId, email, isAdmin);

        long totalDays = Math.max(0, ChronoUnit.DAYS.between(project.startDate(), project.deadline()));
        long elapsedDays = Math.max(0, Math.min(totalDays, ChronoUnit.DAYS.between(project.startDate(), today)));
        long remainingDays = ChronoUnit.DAYS.between(today, project.deadline());
        double planned = AnalyticsMath.plannedProgress(project.startDate(), project.deadline(), today);
        double actual = project.completedPercentage();
        ProjectReportResponse.Timeline timeline = new ProjectReportResponse.Timeline(
                project.startDate(), project.deadline(), totalDays, elapsedDays, remainingDays,
                planned, actual, AnalyticsMath.round2(planned - actual));

        return new ProjectReportResponse(
                project, timeline, health, budget,
                milestoneService.list(projectId, email, isAdmin),
                progressService.history(projectId, email, isAdmin),
                expenseService.history(projectId, email, isAdmin),
                photoService.list(projectId, email, isAdmin),
                evaluation.alerts(), evaluation.recommendations(), today);
    }
}