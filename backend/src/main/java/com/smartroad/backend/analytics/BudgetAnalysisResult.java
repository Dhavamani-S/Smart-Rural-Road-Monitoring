package com.smartroad.backend.analytics;

import java.math.BigDecimal;

public record BudgetAnalysisResult(
        BigDecimal totalBudget,
        BigDecimal totalExpenditure,
        BigDecimal remainingBudget,
        double utilizationPercent,
        double completedPercent,
        double plannedProgress,
        BigDecimal plannedExpenditure,
        BigDecimal budgetVariance,
        double budgetVariancePercentOfBudget,
        BigDecimal earnedValue,
        Double costEfficiencyIndex,
        double spendingVsWorkPoints,
        BudgetStatus status,
        String interpretation) {
}