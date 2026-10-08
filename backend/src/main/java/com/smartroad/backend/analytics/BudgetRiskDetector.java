package com.smartroad.backend.analytics;

import com.smartroad.backend.entity.AlertCategory;
import com.smartroad.backend.entity.ProjectStatus;
import com.smartroad.backend.entity.Severity;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
@RequiredArgsConstructor
public class BudgetRiskDetector {

    private final AnalyticsProperties props;

    public List<Finding> detect(EvaluationInput in) {
        ProjectMetrics m = in.metrics();
        List<Finding> findings = new ArrayList<>();

        BigDecimal budget = m.totalBudget();
        BigDecimal spent = m.totalExpenditure() == null ? BigDecimal.ZERO : m.totalExpenditure();
        if (budget == null || budget.signum() <= 0) {
            return findings;
        }

        double actual = AnalyticsMath.clamp(m.completedPercentage(), 0, 100);
        boolean completed = m.status() == ProjectStatus.COMPLETED || actual >= 100;
        double utilization = AnalyticsMath.utilizationPercent(spent, budget);
        boolean overBudget = spent.compareTo(budget) > 0;

        if (overBudget) {
            findings.add(new Finding(AlertCategory.BUDGET, RuleCodes.BUDGET_OVER, Severity.HIGH,
                    "Expenditure exceeds the allocated budget",
                    "Recorded expenditure (" + money(spent) + ") is " + money(spent.subtract(budget))
                            + " above the allocated budget (" + money(budget) + ").",
                    "Stop non-essential spending, verify the recorded expenses and prepare a budget revision request.",
                    true));
        } else {
            double gap = utilization - actual;
            if (gap > props.getBudgetReviewGapPoints()) {
                Severity severity = gap >= props.getBudgetSevereGapPoints() ? Severity.HIGH : Severity.MEDIUM;
                findings.add(new Finding(AlertCategory.BUDGET, RuleCodes.BUDGET_AHEAD, severity,
                        "Spending ahead of completed work",
                        String.format(Locale.ROOT,
                                "%.1f%% of the budget is spent but only %.1f%% of the work is complete "
                                        + "(%.1f points ahead). This is a risk indicator for review, "
                                        + "not a confirmed financial problem.", utilization, actual, gap),
                        "Review the expense records against work completion data (budget review).",
                        false));
            }
            if (!completed && utilization >= props.getNearLimitPercent() && actual < utilization) {
                findings.add(new Finding(AlertCategory.BUDGET, RuleCodes.BUDGET_NEAR_LIMIT, Severity.MEDIUM,
                        "Approaching the budget limit",
                        String.format(Locale.ROOT,
                                "%.1f%% of the budget is already spent while %.1f%% of the work is complete; "
                                        + "the remaining budget is %s.",
                                utilization, actual, money(budget.subtract(spent))),
                        "Monitor the remaining budget closely and plan the remaining work within it.",
                        false));
            }
        }

        Finding rapid = rapidSpend(in, budget, completed);
        if (rapid != null) {
            findings.add(rapid);
        }
        return findings;
    }

    private Finding rapidSpend(EvaluationInput in, BigDecimal budget, boolean completed) {
        if (completed || in.expenses().isEmpty()) {
            return null;
        }
        long window = Math.max(1, props.getRapidWindowDays());
        LocalDate windowStart = in.metrics().today().minusDays(window);

        BigDecimal recent = BigDecimal.ZERO;
        BigDecimal previous = BigDecimal.ZERO;
        LocalDate first = null;
        for (ExpenseEntry e : in.expenses()) {
            if (e.date().isAfter(windowStart)) {
                recent = recent.add(e.amount());
            } else {
                previous = previous.add(e.amount());
            }
            if (first == null || e.date().isBefore(first)) {
                first = e.date();
            }
        }
        if (recent.signum() == 0) {
            return null;
        }

        double recentPercent = recent.doubleValue() / budget.doubleValue() * 100;
        if (previous.signum() > 0) {
            long previousSpan = ChronoUnit.DAYS.between(first, windowStart);
            if (previousSpan < window) {
                return null;
            }
            double previousDaily = previous.doubleValue() / previousSpan;
            double recentDaily = recent.doubleValue() / window;
            if (recentPercent >= props.getRapidMinPercentOfBudget()
                    && recentDaily > props.getRapidSpendMultiplier() * previousDaily) {
                return new Finding(AlertCategory.BUDGET, RuleCodes.BUDGET_RAPID_SPEND, Severity.MEDIUM,
                        "Rapid increase in expenses",
                        String.format(Locale.ROOT,
                                "Spending in the last %d days (%s, %.1f%% of the budget) is %.1f times the "
                                        + "earlier daily average.",
                                window, money(recent), recentPercent, recentDaily / previousDaily),
                        "Verify the recent large expenses against the work completed and request supporting records.",
                        false);
            }
        } else if (recentPercent >= props.getRapidFirstSpendPercentOfBudget()) {
            return new Finding(AlertCategory.BUDGET, RuleCodes.BUDGET_RAPID_SPEND, Severity.MEDIUM,
                    "Rapid increase in expenses",
                    String.format(Locale.ROOT,
                            "All recorded spending (%s, %.1f%% of the budget) happened in the last %d days.",
                            money(recent), recentPercent, window),
                    "Verify the recent large expenses against the work completed and request supporting records.",
                    false);
        }
        return null;
    }

    private String money(BigDecimal value) {
        return value.setScale(2, RoundingMode.HALF_UP).toPlainString();
    }
}