package com.smartroad.backend.dto;

import com.smartroad.backend.entity.ProjectStatus;

import java.time.LocalDate;
import java.util.List;

public record ProjectEvaluationResponse(
        Long projectId,
        String projectName,
        ProjectStatus projectStatus,
        boolean delayed,
        double healthIndex,
        String healthCategory,
        LocalDate evaluatedOn,
        List<AlertResponse> alerts,
        List<RecommendationResponse> recommendations) {
}