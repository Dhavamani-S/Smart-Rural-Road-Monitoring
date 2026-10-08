package com.smartroad.backend.dto;

import com.smartroad.backend.entity.Expense;
import com.smartroad.backend.entity.ExpenseCategory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExpenseResponse(
        Long id,
        Long projectId,
        BigDecimal amount,
        ExpenseCategory category,
        LocalDate expenseDate,
        String description,
        Long recordedById,
        String recordedByName,
        LocalDateTime createdAt) {

    public static ExpenseResponse from(Expense e) {
        return new ExpenseResponse(e.getId(), e.getProject().getId(), e.getAmount(), e.getCategory(),
                e.getExpenseDate(), e.getDescription(), e.getRecordedBy().getId(),
                e.getRecordedBy().getFullName(), e.getCreatedAt());
    }
}