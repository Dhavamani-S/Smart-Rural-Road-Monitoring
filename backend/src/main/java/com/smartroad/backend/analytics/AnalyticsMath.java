package com.smartroad.backend.analytics;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;

public final class AnalyticsMath {

    private AnalyticsMath() {
    }

    public static double clamp(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    public static double round1(double value) {
        return Math.round(value * 10.0) / 10.0;
    }

    public static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }

    /** Time-based planned progress in percent (0 to 100). */
    public static double plannedProgress(LocalDate start, LocalDate deadline, LocalDate today) {
        long totalDays = ChronoUnit.DAYS.between(start, deadline);
        if (totalDays <= 0) {
            return today.isBefore(deadline) ? 0 : 100;
        }
        long elapsedDays = ChronoUnit.DAYS.between(start, today);
        return round2(clamp(elapsedDays * 100.0 / totalDays, 0, 100));
    }

    /** Budget utilization in percent; returns 0 when the budget is missing or zero. */
    public static double utilizationPercent(BigDecimal expenditure, BigDecimal budget) {
        if (budget == null || budget.signum() <= 0 || expenditure == null) {
            return 0;
        }
        return expenditure.multiply(BigDecimal.valueOf(100))
                .divide(budget, 2, RoundingMode.HALF_UP).doubleValue();
    }
}