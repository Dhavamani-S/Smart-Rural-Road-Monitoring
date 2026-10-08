package com.smartroad.backend.analytics;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ExpenseEntry(LocalDate date, BigDecimal amount) {
}