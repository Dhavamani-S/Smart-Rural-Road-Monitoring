package com.smartroad.backend.analytics;

import com.smartroad.backend.entity.ProjectStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import static com.smartroad.backend.analytics.AnalyticsMath.clamp;
import static com.smartroad.backend.analytics.AnalyticsMath.round1;

@Component
@RequiredArgsConstructor
public class HealthIndexCalculator {

    private final AnalyticsProperties props;

    public HealthIndexResult calculate(ProjectMetrics m) {
        List<String> factors = new ArrayList<>();
        List<String> notes = new ArrayList<>();

        double planned = AnalyticsMath.plannedProgress(m.startDate(), m.deadline(), m.today());
        double actual = clamp(m.completedPercentage(), 0, 100);
        boolean completed = m.status() == ProjectStatus.COMPLETED || actual >= 100;
        boolean overdue = !completed && m.today().isAfter(m.deadline());

        double progressScore = progressScore(planned, actual, completed, factors);
        double scheduleScore = scheduleScore(planned, actual, completed, overdue, m.overdueMilestones(), factors);
        double budgetScore = budgetScore(actual, m, factors);
        collectNotes(m, planned, actual, completed, overdue, notes);

        double wp = props.getWeightProgress();
        double wb = props.getWeightBudget();
        double ws = props.getWeightSchedule();
        double sum = wp + wb + ws;
        if (sum <= 0) {
            wp = 0.40;
            wb = 0.30;
            ws = 0.30;
            sum = 1.0;
        }
        wp /= sum;
        wb /= sum;
        ws /= sum;

        double index = round1(clamp(wp * progressScore + wb * budgetScore + ws * scheduleScore, 0, 100));
        HealthCategory category;
        if (index >= props.getHealthyThreshold()) {
            category = HealthCategory.HEALTHY;
        } else if (index >= props.getAttentionThreshold()) {
            category = HealthCategory.NEEDS_ATTENTION;
        } else {
            category = HealthCategory.CRITICAL;
        }

        return new HealthIndexResult(index, category, progressScore, budgetScore, scheduleScore,
                planned, actual, round1(wp * 100) / 100.0, round1(wb * 100) / 100.0, round1(ws * 100) / 100.0,
                factors, notes);
    }

    private double progressScore(double planned, double actual, boolean completed, List<String> factors) {
        double score;
        if (completed) {
            score = 100;
            factors.add("Progress: the project is complete.");
        } else if (planned <= 0) {
            score = 100;
            factors.add("Progress: no work is planned yet, so the score defaults to 100.");
        } else {
            score = clamp(actual / planned * 100, 0, 100);
            factors.add(String.format(Locale.ROOT,
                    "Progress: %.1f%% of the work is complete against %.1f%% planned by today (%.1f%% of plan).",
                    actual, planned, score));
        }
        return round1(score);
    }

    private double scheduleScore(double planned, double actual, boolean completed, boolean overdue,
                                 int overdueMilestones, List<String> factors) {
        if (completed) {
            factors.add("Schedule: the project is complete, so no delay penalty applies.");
            return 100;
        }
        double gap = Math.max(0, planned - actual);
        double tolerance = props.getScheduleTolerancePoints();
        double score = 100 - Math.max(0, gap - tolerance) * props.getSchedulePenaltyPerPoint();
        score -= overdueMilestones * props.getMissedMilestonePenalty();
        if (overdue) {
            score = Math.min(score, props.getOverdueScoreCap());
        }
        score = clamp(score, 0, 100);
        factors.add(String.format(Locale.ROOT,
                "Schedule: %.1f percentage points behind plan (tolerance %.1f), %d overdue milestone(s)%s.",
                gap, tolerance, overdueMilestones, overdue ? ", deadline has passed" : ""));
        return round1(score);
    }

    private double budgetScore(double actual, ProjectMetrics m, List<String> factors) {
        if (m.totalBudget() == null || m.totalBudget().signum() <= 0) {
            boolean spent = m.totalExpenditure() != null && m.totalExpenditure().signum() > 0;
            factors.add("Budget: no valid budget is set for this project.");
            return spent ? 0 : 100;
        }
        double utilization = AnalyticsMath.utilizationPercent(m.totalExpenditure(), m.totalBudget());
        double difference = utilization - actual;
        double score = 100 - Math.max(0, difference - props.getBudgetTolerancePoints())
                * props.getBudgetPenaltyPerPoint();
        boolean overBudget = utilization > 100;
        if (overBudget) {
            score = Math.min(score, props.getOverBudgetScoreCap());
        }
        score = clamp(score, 0, 100);
        factors.add(String.format(Locale.ROOT,
                "Budget: %.1f%% of the budget is spent for %.1f%% of the work (difference %+.1f points)%s.",
                utilization, actual, difference, overBudget ? ", spending exceeds the budget" : ""));
        return round1(score);
    }

    private void collectNotes(ProjectMetrics m, double planned, double actual,
                              boolean completed, boolean overdue, List<String> notes) {
        if (m.today().isBefore(m.startDate())) {
            notes.add("The project has not started yet (start date " + m.startDate()
                    + "), so scores stay at 100 until work is planned.");
        }
        if (overdue) {
            long days = ChronoUnit.DAYS.between(m.deadline(), m.today());
            notes.add("The deadline passed " + days + " day(s) ago and the project is incomplete.");
        }
        if (!completed && planned > 0 && m.lastProgressUpdate() == null) {
            notes.add("No progress updates have been recorded yet.");
        } else if (!completed && m.lastProgressUpdate() != null && m.status() != ProjectStatus.ON_HOLD) {
            long days = ChronoUnit.DAYS.between(m.lastProgressUpdate(), m.today());
            if (days > props.getStaleUpdateDays()) {
                notes.add("The last progress update was " + days + " day(s) ago.");
            }
        }
        if (m.totalExpenditure() != null && m.totalExpenditure().signum() == 0 && actual > 0) {
            notes.add(String.format(Locale.ROOT,
                    "No expenses are recorded although %.1f%% of the work is reported complete; check the expense records.",
                    actual));
        }
        if (m.status() == ProjectStatus.ON_HOLD) {
            notes.add("The project is on hold, but the planned timeline keeps running, so schedule scores may drop.");
        }
    }
}