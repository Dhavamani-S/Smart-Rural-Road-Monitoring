package com.smartroad.backend.dto;

import com.smartroad.backend.entity.Recommendation;
import com.smartroad.backend.entity.RecommendationType;
import com.smartroad.backend.entity.Severity;

import java.time.LocalDate;

public record RecommendationResponse(
        Long id,
        Long projectId,
        String projectName,
        String ruleCode,
        RecommendationType type,
        String issueDetected,
        Severity severity,
        String reason,
        String recommendedAction,
        String triggeredRule,
        LocalDate generatedOn) {

    public static RecommendationResponse from(Recommendation r) {
        return new RecommendationResponse(r.getId(), r.getProject().getId(), r.getProject().getName(),
                r.getRuleCode(), r.getType(), r.getIssueDetected(), r.getSeverity(), r.getReason(),
                r.getRecommendedAction(), r.getTriggeredRule(), r.getGeneratedOn());
    }
}