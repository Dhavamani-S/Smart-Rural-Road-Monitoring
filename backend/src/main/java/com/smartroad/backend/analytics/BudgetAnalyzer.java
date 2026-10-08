package com.smartroad.backend.analytics;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;

import static com.smartroad.backend.analytics.AnalyticsMath.clamp;
import static com.smartroad.backend.analytics.AnalyticsMath.round1;

@Component
@RequiredArgsConstructor
public class BudgetAnalyzer {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final AnalyticsProperties props;

    public BudgetAnalysisResult analyze(ProjectMetrics m) {
        BigDecimal budget = m.totalBudget() == null ? BigDecimal.ZERO : m.totalBudget();
        BigDecimal spent = m.totalExpenditure() == null ? BigDecimal.ZERO : m.totalExpenditure();

        double planned = AnalyticsMath.plannedProgress(m.startDate(), m.deadline(), m.today());
        double actual = clamp(m.completedPercentage(), 0, 100);
        double utilization = AnalyticsMath.utilizationPercent(spent, budget);

        BigDecimal remaining = budget.subtract(spent);
        BigDecimal plannedExpenditure = budget.multiply(BigDecimal.valueOf(planned))
                .divide(HUNDRED, 2, RoundingMode.HALF_UP);
        BigDecimal variance = spent.subtract(plannedExpenditure);
        double variancePercent = budget.signum() > 0
                ? variance.multiply(HUNDRED).divide(budget, 2, RoundingMode.HALF_UP).doubleValue()
                : 0;
        BigDecimal earnedValue = budget.multiply(BigDecimal.valueOf(actual))
                .divide(HUNDRED, 2, RoundingMode.HALF_UP);
        Double efficiencyIndex = spent.signum() > 0
                ? earnedValue.divide(spent, 2, RoundingMode.HALF_UP).doubleValue()
                : null;

        double spendingVsWork = round1(utilization - actual);
        BudgetStatus status;
        String interpretation;
        if (budget.signum() > 0 && spent.compareTo(budget) > 0) {
            status = BudgetStatus.OVER_BUDGET;
            interpretation = "Recorded expenditure exceeds the allocated budget by "
                    + spent.subtract(budget).setScale(2, RoundingMode.HALF_UP) + ".";
        } else if (spendingVsWork > props.getBudgetTolerancePoints()) {
            status = BudgetStatus.SPENDING_AHEAD_OF_WORK;
            interpretation = String.format(Locale.ROOT,
                    "Spending is %.1f points ahead of completed work. This is a risk indicator for review, "
                            + "not a confirmed financial problem.", spendingVsWork);
        } else {
            status = BudgetStatus.WITHIN_PLAN;
            interpretation = "Spending is in line with the completed work.";
        }

        return new BudgetAnalysisResult(budget, spent, remaining, utilization, actual, planned,
                plannedExpenditure, variance, variancePercent, earnedValue, efficiencyIndex,
                spendingVsWork, status, interpretation);
    }
}