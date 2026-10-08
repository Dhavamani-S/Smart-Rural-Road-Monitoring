package com.smartroad.backend.dto;

import com.smartroad.backend.entity.AlertCategory;
import com.smartroad.backend.entity.RiskAlert;
import com.smartroad.backend.entity.Severity;

import java.time.LocalDate;

public record AlertResponse(
        Long id,
        Long projectId,
        String projectName,
        AlertCategory category,
        String ruleCode,
        Severity severity,
        String title,
        String reason,
        String suggestedAction,
        boolean confirmed,
        LocalDate generatedOn) {

    public static AlertResponse from(RiskAlert a) {
        return new AlertResponse(a.getId(), a.getProject().getId(), a.getProject().getName(), a.getCategory(),
                a.getRuleCode(), a.getSeverity(), a.getTitle(), a.getReason(), a.getSuggestedAction(),
                a.isConfirmed(), a.getGeneratedOn());
    }
}