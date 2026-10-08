package com.smartroad.backend.dto;

import com.smartroad.backend.analytics.BudgetAnalysisResult;
import com.smartroad.backend.entity.ExpenseCategory;

import java.math.BigDecimal;
import java.util.Map;

public record BudgetAnalysisResponse(
        Long projectId,
        String projectName,
        BudgetAnalysisResult analysis,
        Map<ExpenseCategory, BigDecimal> expenseByCategory) {
}