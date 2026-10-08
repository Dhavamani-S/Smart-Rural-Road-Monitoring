package com.smartroad.backend.service;

import com.smartroad.backend.analytics.BudgetRiskDetector;
import com.smartroad.backend.analytics.DelayDetector;
import com.smartroad.backend.analytics.EvaluationInput;
import com.smartroad.backend.analytics.ExpenseEntry;
import com.smartroad.backend.analytics.Finding;
import com.smartroad.backend.analytics.HealthIndexCalculator;
import com.smartroad.backend.analytics.HealthIndexResult;
import com.smartroad.backend.analytics.ProjectMetrics;
import com.smartroad.backend.analytics.RecommendationEngine;
import com.smartroad.backend.analytics.RecommendationItem;
import com.smartroad.backend.analytics.RuleCodes;
import com.smartroad.backend.dto.AlertResponse;
import com.smartroad.backend.dto.ProjectEvaluationResponse;
import com.smartroad.backend.dto.RecommendationResponse;
import com.smartroad.backend.entity.ProgressUpdate;
import com.smartroad.backend.entity.Project;
import com.smartroad.backend.entity.ProjectStatus;
import com.smartroad.backend.entity.Recommendation;
import com.smartroad.backend.entity.RecommendationType;
import com.smartroad.backend.entity.RiskAlert;
import com.smartroad.backend.repository.ExpenseRepository;
import com.smartroad.backend.repository.MilestoneRepository;
import com.smartroad.backend.repository.ProgressUpdateRepository;
import com.smartroad.backend.repository.ProjectRepository;
import com.smartroad.backend.repository.RecommendationRepository;
import com.smartroad.backend.repository.RiskAlertRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EvaluationService {

    private final ProjectAccessService accessService;
    private final ProjectRepository projectRepository;
    private final MilestoneRepository milestoneRepository;
    private final ProgressUpdateRepository progressUpdateRepository;
    private final ExpenseRepository expenseRepository;
    private final RiskAlertRepository riskAlertRepository;
    private final RecommendationRepository recommendationRepository;
    private final HealthIndexCalculator healthCalculator;
    private final DelayDetector delayDetector;
    private final BudgetRiskDetector budgetRiskDetector;
    private final RecommendationEngine recommendationEngine;

    @Transactional
    public ProjectEvaluationResponse evaluate(Long projectId, String email, boolean isAdmin) {
        Project project = accessService.requireAccess(projectId, email, isAdmin);
        return evaluateAndStore(project, LocalDate.now());
    }

    @Transactional
    public List<AlertResponse> allAlerts(String email, boolean isAdmin) {
        LocalDate today = LocalDate.now();
        List<AlertResponse> all = new ArrayList<>();
        for (Project project : accessibleProjects(email, isAdmin)) {
            all.addAll(evaluateAndStore(project, today).alerts());
        }
        all.sort((a, b) -> {
            int bySeverity = b.severity().compareTo(a.severity());
            return bySeverity != 0 ? bySeverity : a.projectName().compareToIgnoreCase(b.projectName());
        });
        return all;
    }

    @Transactional
    public List<RecommendationResponse> allRecommendations(String email, boolean isAdmin, boolean issuesOnly) {
        LocalDate today = LocalDate.now();
        List<RecommendationResponse> all = new ArrayList<>();
        for (Project project : accessibleProjects(email, isAdmin)) {
            for (RecommendationResponse r : evaluateAndStore(project, today).recommendations()) {
                if (!issuesOnly || r.type() == RecommendationType.ISSUE) {
                    all.add(r);
                }
            }
        }
        all.sort((a, b) -> {
            int bySeverity = b.severity().compareTo(a.severity());
            return bySeverity != 0 ? bySeverity : a.projectName().compareToIgnoreCase(b.projectName());
        });
        return all;
    }

    @Transactional
    public List<ProjectEvaluationResponse> evaluateAll(String email, boolean isAdmin) {
        LocalDate today = LocalDate.now();
        List<ProjectEvaluationResponse> results = new ArrayList<>();
        for (Project project : accessibleProjects(email, isAdmin)) {
            results.add(evaluateAndStore(project, today));
        }
        return results;
    }

    private List<Project> accessibleProjects(String email, boolean isAdmin) {
        return isAdmin
                ? projectRepository.findAll(Sort.by(Sort.Direction.ASC, "name"))
                : projectRepository.findByAssignedEngineerEmail(email);
    }

    private ProjectEvaluationResponse evaluateAndStore(Project project, LocalDate today) {
        Long id = project.getId();

        LocalDate lastUpdate = progressUpdateRepository.findByProjectIdOrderByUpdateDateDescIdDesc(id)
                .stream().findFirst().map(ProgressUpdate::getUpdateDate).orElse(null);
        List<String> overdueMilestones = milestoneRepository.findByProjectIdOrderByTargetDateAsc(id).stream()
                .filter(m -> !m.isCompleted() && m.getTargetDate().isBefore(today))
                .map(m -> m.getTitle() + " (target " + m.getTargetDate() + ")")
                .toList();
        List<ExpenseEntry> expenses = expenseRepository.findByProjectIdOrderByExpenseDateDescIdDesc(id).stream()
                .map(e -> new ExpenseEntry(e.getExpenseDate(), e.getAmount()))
                .toList();

        ProjectMetrics metrics = new ProjectMetrics(today, project.getStartDate(), project.getDeadline(),
                project.getCompletedPercentage(), project.getStatus(), project.getTotalBudget(),
                project.getTotalExpenditure(), overdueMilestones.size(), lastUpdate);
        EvaluationInput input = new EvaluationInput(project.getName(), metrics, overdueMilestones, expenses);

        HealthIndexResult health = healthCalculator.calculate(metrics);
        List<Finding> delayFindings = delayDetector.detect(input);
        List<Finding> budgetFindings = budgetRiskDetector.detect(input);
        List<RecommendationItem> items = recommendationEngine.generate(input, health, delayFindings, budgetFindings);

        boolean delayed = delayFindings.stream().anyMatch(f ->
                RuleCodes.DELAY_OVERDUE.equals(f.ruleCode()) || RuleCodes.DELAY_PROGRESS_GAP.equals(f.ruleCode()));
        if (project.getStatus() == ProjectStatus.IN_PROGRESS && delayed) {
            project.setStatus(ProjectStatus.DELAYED);
            projectRepository.save(project);
        } else if (project.getStatus() == ProjectStatus.DELAYED && !delayed) {
            project.setStatus(ProjectStatus.IN_PROGRESS);
            projectRepository.save(project);
        }

        List<Finding> findings = new ArrayList<>(delayFindings);
        findings.addAll(budgetFindings);
        findings.sort((a, b) -> b.severity().compareTo(a.severity()));

        riskAlertRepository.deleteByProjectId(id);
        recommendationRepository.deleteByProjectId(id);

        List<RiskAlert> alerts = new ArrayList<>();
        for (Finding f : findings) {
            RiskAlert alert = new RiskAlert();
            alert.setProject(project);
            alert.setCategory(f.category());
            alert.setRuleCode(f.ruleCode());
            alert.setSeverity(f.severity());
            alert.setTitle(cut(f.title(), 300));
            alert.setReason(cut(f.reason(), 1000));
            alert.setSuggestedAction(cut(f.action(), 1000));
            alert.setConfirmed(f.confirmed());
            alert.setGeneratedOn(today);
            alerts.add(alert);
        }
        List<RiskAlert> savedAlerts = riskAlertRepository.saveAll(alerts);

        List<Recommendation> recommendations = new ArrayList<>();
        for (RecommendationItem item : items) {
            Recommendation rec = new Recommendation();
            rec.setProject(project);
            rec.setRuleCode(item.ruleCode());
            rec.setType(item.type());
            rec.setIssueDetected(cut(item.issue(), 300));
            rec.setSeverity(item.severity());
            rec.setReason(cut(item.reason(), 1000));
            rec.setRecommendedAction(cut(item.action(), 1000));
            rec.setTriggeredRule(cut(item.triggeredRule(), 500));
            rec.setGeneratedOn(today);
            recommendations.add(rec);
        }
        List<Recommendation> savedRecommendations = recommendationRepository.saveAll(recommendations);

        return new ProjectEvaluationResponse(id, project.getName(), project.getStatus(), delayed,
                health.healthIndex(), health.category().getLabel(), today,
                savedAlerts.stream().map(AlertResponse::from).toList(),
                savedRecommendations.stream().map(RecommendationResponse::from).toList());
    }

    private String cut(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max - 3) + "...";
    }
}