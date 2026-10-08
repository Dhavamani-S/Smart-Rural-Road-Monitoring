package com.smartroad.backend.service;

import com.smartroad.backend.analytics.AnalyticsMath;
import com.smartroad.backend.analytics.HealthCategory;
import com.smartroad.backend.dto.AlertResponse;
import com.smartroad.backend.dto.DashboardResponse;
import com.smartroad.backend.dto.ProjectEvaluationResponse;
import com.smartroad.backend.dto.RecommendationResponse;
import com.smartroad.backend.entity.Expense;
import com.smartroad.backend.entity.ExpenseCategory;
import com.smartroad.backend.entity.Milestone;
import com.smartroad.backend.entity.ProgressUpdate;
import com.smartroad.backend.entity.Project;
import com.smartroad.backend.entity.ProjectStatus;
import com.smartroad.backend.entity.RecommendationType;
import com.smartroad.backend.entity.Severity;
import com.smartroad.backend.repository.ExpenseRepository;
import com.smartroad.backend.repository.MilestoneRepository;
import com.smartroad.backend.repository.ProgressUpdateRepository;
import com.smartroad.backend.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final ProgressUpdateRepository progressUpdateRepository;
    private final ExpenseRepository expenseRepository;
    private final EvaluationService evaluationService;

    @Transactional
    public DashboardResponse build(String email, boolean isAdmin) {
        LocalDate today = LocalDate.now();

        // Re-evaluate first so statuses, alerts and recommendations are current.
        List<ProjectEvaluationResponse> evaluations = evaluationService.evaluateAll(email, isAdmin);
        Map<Long, ProjectEvaluationResponse> evaluationById = new HashMap<>();
        for (ProjectEvaluationResponse e : evaluations) {
            evaluationById.put(e.projectId(), e);
        }

        List<Project> projects = isAdmin
                ? projectRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                : projectRepository.findByAssignedEngineerEmail(email);

        Map<ProjectStatus, Long> statusDistribution = new EnumMap<>(ProjectStatus.class);
        for (ProjectStatus status : ProjectStatus.values()) {
            statusDistribution.put(status, 0L);
        }
        Map<ExpenseCategory, BigDecimal> expenseDistribution = new EnumMap<>(ExpenseCategory.class);
        List<DashboardResponse.ProjectRow> rows = new ArrayList<>();
        List<DashboardResponse.ProgressSeries> timeline = new ArrayList<>();
        List<ProgressUpdate> allUpdates = new ArrayList<>();
        List<DashboardResponse.PendingMilestone> pending = new ArrayList<>();
        BigDecimal totalBudget = BigDecimal.ZERO;
        BigDecimal totalSpent = BigDecimal.ZERO;
        int attention = 0;
        int highRisk = 0;

        for (Project p : projects) {
            statusDistribution.merge(p.getStatus(), 1L, Long::sum);
            totalBudget = totalBudget.add(p.getTotalBudget());
            totalSpent = totalSpent.add(p.getTotalExpenditure());

            ProjectEvaluationResponse evaluation = evaluationById.get(p.getId());
            double healthIndex = 0;
            String healthLabel = null;
            if (evaluation != null) {
                healthIndex = evaluation.healthIndex();
                healthLabel = evaluation.healthCategory();
                if (!HealthCategory.HEALTHY.getLabel().equals(healthLabel)) {
                    attention++;
                }
                if (evaluation.alerts().stream().anyMatch(a -> a.severity() == Severity.HIGH)) {
                    highRisk++;
                }
            }

            rows.add(new DashboardResponse.ProjectRow(
                    p.getId(), p.getName(), p.getLocation(), p.getStatus(), p.getDeadline(),
                    p.getAssignedEngineer() == null ? null : p.getAssignedEngineer().getFullName(),
                    p.getCompletedPercentage(),
                    AnalyticsMath.plannedProgress(p.getStartDate(), p.getDeadline(), today),
                    p.getTotalBudget(), p.getTotalExpenditure(),
                    p.getTotalBudget().subtract(p.getTotalExpenditure()),
                    AnalyticsMath.utilizationPercent(p.getTotalExpenditure(), p.getTotalBudget()),
                    healthIndex, healthLabel));

            List<ProgressUpdate> updates = progressUpdateRepository.findByProjectIdOrderByUpdateDateDescIdDesc(p.getId());
            allUpdates.addAll(updates);
            List<DashboardResponse.Point> points = new ArrayList<>();
            for (int i = Math.min(updates.size(), 60) - 1; i >= 0; i--) {
                points.add(new DashboardResponse.Point(updates.get(i).getUpdateDate(),
                        updates.get(i).getCompletedPercentage()));
            }
            timeline.add(new DashboardResponse.ProgressSeries(p.getId(), p.getName(), points));

            for (Expense expense : expenseRepository.findByProjectIdOrderByExpenseDateDescIdDesc(p.getId())) {
                expenseDistribution.merge(expense.getCategory(), expense.getAmount(), BigDecimal::add);
            }

            for (Milestone m : milestoneRepository.findByProjectIdOrderByTargetDateAsc(p.getId())) {
                if (!m.isCompleted()) {
                    pending.add(new DashboardResponse.PendingMilestone(m.getId(), p.getId(), p.getName(),
                            m.getTitle(), m.getTargetDate(), m.getTargetDate().isBefore(today)));
                }
            }
        }

        allUpdates.sort((a, b) -> {
            int byDate = b.getUpdateDate().compareTo(a.getUpdateDate());
            return byDate != 0 ? byDate : Long.compare(b.getId(), a.getId());
        });
        List<DashboardResponse.RecentUpdate> recentUpdates = allUpdates.stream().limit(10)
                .map(u -> new DashboardResponse.RecentUpdate(u.getProject().getId(), u.getProject().getName(),
                        u.getCompletedPercentage(), u.getRemarks(), u.getUpdateDate(),
                        u.getUpdatedBy().getFullName()))
                .toList();

        pending.sort((a, b) -> a.targetDate().compareTo(b.targetDate()));
        List<DashboardResponse.PendingMilestone> pendingMilestones = pending.stream().limit(20).toList();

        List<AlertResponse> alerts = new ArrayList<>();
        List<RecommendationResponse> recommendations = new ArrayList<>();
        for (ProjectEvaluationResponse e : evaluations) {
            alerts.addAll(e.alerts());
            for (RecommendationResponse r : e.recommendations()) {
                if (r.type() == RecommendationType.ISSUE) {
                    recommendations.add(r);
                }
            }
        }
        alerts.sort((a, b) -> {
            int bySeverity = b.severity().compareTo(a.severity());
            return bySeverity != 0 ? bySeverity : a.projectName().compareToIgnoreCase(b.projectName());
        });
        recommendations.sort((a, b) -> {
            int bySeverity = b.severity().compareTo(a.severity());
            return bySeverity != 0 ? bySeverity : a.projectName().compareToIgnoreCase(b.projectName());
        });

        DashboardResponse.Summary summary = new DashboardResponse.Summary(
                projects.size(),
                statusDistribution.get(ProjectStatus.NOT_STARTED).intValue(),
                statusDistribution.get(ProjectStatus.IN_PROGRESS).intValue(),
                statusDistribution.get(ProjectStatus.COMPLETED).intValue(),
                statusDistribution.get(ProjectStatus.DELAYED).intValue(),
                statusDistribution.get(ProjectStatus.ON_HOLD).intValue(),
                totalBudget, totalSpent, totalBudget.subtract(totalSpent),
                AnalyticsMath.utilizationPercent(totalSpent, totalBudget),
                attention, highRisk);

        return new DashboardResponse(summary, statusDistribution, rows, expenseDistribution, timeline,
                recentUpdates, pendingMilestones,
                alerts.stream().limit(30).toList(), recommendations.stream().limit(30).toList(), today);
    }
}