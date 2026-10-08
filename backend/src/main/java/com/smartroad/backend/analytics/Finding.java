package com.smartroad.backend.analytics;

import com.smartroad.backend.entity.AlertCategory;
import com.smartroad.backend.entity.Severity;

public record Finding(
        AlertCategory category,
        String ruleCode,
        Severity severity,
        String title,
        String reason,
        String action,
        boolean confirmed) {
}