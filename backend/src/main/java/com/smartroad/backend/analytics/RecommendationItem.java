package com.smartroad.backend.analytics;

import com.smartroad.backend.entity.RecommendationType;
import com.smartroad.backend.entity.Severity;

public record RecommendationItem(
        String ruleCode,
        RecommendationType type,
        String issue,
        Severity severity,
        String reason,
        String action,
        String triggeredRule) {
}