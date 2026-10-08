package com.smartroad.backend.service;

import com.smartroad.backend.analytics.BudgetAnalysisResult;
import com.smartroad.backend.analytics.BudgetAnalyzer;
import com.smartroad.backend.analytics.HealthIndexCalculator;
import com.smartroad.backend.analytics.HealthIndexResult;
import com.smartroad.backend.analytics.ProjectMetrics;
import com.smartroad.backend.dto.BudgetAnalysisResponse;
import com.smartroad.backend.dto.HealthIndexResponse;
import com.smartroad.backend.entity.Expense;
import com.smartroad.backend.entity.ExpenseCategory;
import com.smartroad.backend.entity.ProgressUpdate;
import com.smartroad.backend.entity.Project;
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
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final ProjectAccessService accessService;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final ProgressUpdateRepository progressUpdateRepository;
    private final ExpenseRepository expenseRepository;
    private final HealthIndexCalculator healthCalculator;
    private final BudgetAnalyzer budgetAnalyzer;

    @Transactional(readOnly = true)
    public HealthIndexResponse health(Long projectId, String email, boolean isAdmin) {
        Project project = accessService.requireAccess(projectId, email, isAdmin);
        return buildHealth(project, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public BudgetAnalysisResponse budget(Long projectId, String email, boolean isAdmin) {
        Project project = accessService.requireAccess(projectId, email, isAdmin);
        LocalDate today = LocalDate.now();
        BudgetAnalysisResult analysis = budgetAnalyzer.analyze(metricsFor(project, today, lastUpdateOf(projectId)));

        Map<ExpenseCategory, BigDecimal> byCategory = new EnumMap<>(ExpenseCategory.class);
        for (Expense expense : expenseRepository.findByProjectIdOrderByExpenseDateDescIdDesc(projectId)) {
            byCategory.merge(expense.getCategory(), expense.getAmount(), BigDecimal::add);
        }
        return new BudgetAnalysisResponse(project.getId(), project.getName(), analysis, byCategory);
    }

    @Transactional(readOnly = true)
    public List<HealthIndexResponse> healthSummary(String email, boolean isAdmin) {
        List<Project> projects = isAdmin
                ? projectRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                : projectRepository.findByAssignedEngineerEmail(email);
        LocalDate today = LocalDate.now();
        return projects.stream().map(p -> buildHealth(p, today)).toList();
    }

    private HealthIndexResponse buildHealth(Project project, LocalDate today) {
        LocalDate lastUpdate = lastUpdateOf(project.getId());
        HealthIndexResult result = healthCalculator.calculate(metricsFor(project, today, lastUpdate));
        return HealthIndexResponse.from(project, result, lastUpdate, today);
    }

    private ProjectMetrics metricsFor(Project project, LocalDate today, LocalDate lastUpdate) {
        int overdueMilestones = (int) milestoneRepository.findByProjectIdOrderByTargetDateAsc(project.getId())
                .stream()
                .filter(m -> !m.isCompleted() && m.getTargetDate().isBefore(today))
                .count();
        return new ProjectMetrics(today, project.getStartDate(), project.getDeadline(),
                project.getCompletedPercentage(), project.getStatus(), project.getTotalBudget(),
                project.getTotalExpenditure(), overdueMilestones, lastUpdate);
    }

    private LocalDate lastUpdateOf(Long projectId) {
        return progressUpdateRepository.findByProjectIdOrderByUpdateDateDescIdDesc(projectId)
                .stream().findFirst().map(ProgressUpdate::getUpdateDate).orElse(null);
    }
}