package com.smartroad.backend.dto;

import com.smartroad.backend.entity.ExpenseCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseRequest(
        @NotNull(message = "Amount is required")
        @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        @Digits(integer = 13, fraction = 2, message = "Amount has too many digits") BigDecimal amount,
        @NotNull(message = "Category is required") ExpenseCategory category,
        @NotNull(message = "Expense date is required")
        @PastOrPresent(message = "Expense date cannot be in the future") LocalDate expenseDate,
        @Size(max = 500, message = "Description must be at most 500 characters") String description) {
}