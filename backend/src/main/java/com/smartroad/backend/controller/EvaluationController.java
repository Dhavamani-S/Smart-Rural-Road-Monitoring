package com.smartroad.backend.controller;

import com.smartroad.backend.dto.AlertResponse;
import com.smartroad.backend.dto.ProjectEvaluationResponse;
import com.smartroad.backend.dto.RecommendationResponse;
import com.smartroad.backend.security.AuthUtil;
import com.smartroad.backend.service.EvaluationService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class EvaluationController {

    private final EvaluationService evaluationService;

    @GetMapping("/api/projects/{projectId}/evaluation")
    public ProjectEvaluationResponse evaluation(@PathVariable Long projectId, Authentication auth) {
        return evaluationService.evaluate(projectId, auth.getName(), AuthUtil.isAdmin(auth));
    }

    @GetMapping("/api/projects/{projectId}/alerts")
    public List<AlertResponse> alerts(@PathVariable Long projectId, Authentication auth) {
        return evaluationService.evaluate(projectId, auth.getName(), AuthUtil.isAdmin(auth)).alerts();
    }

    @GetMapping("/api/projects/{projectId}/recommendations")
    public List<RecommendationResponse> recommendations(@PathVariable Long projectId, Authentication auth) {
        return evaluationService.evaluate(projectId, auth.getName(), AuthUtil.isAdmin(auth)).recommendations();
    }

    @GetMapping("/api/analytics/alerts")
    public List<AlertResponse> allAlerts(Authentication auth) {
        return evaluationService.allAlerts(auth.getName(), AuthUtil.isAdmin(auth));
    }

    @GetMapping("/api/analytics/recommendations")
    public List<RecommendationResponse> allRecommendations(
            @RequestParam(defaultValue = "false") boolean issuesOnly, Authentication auth) {
        return evaluationService.allRecommendations(auth.getName(), AuthUtil.isAdmin(auth), issuesOnly);
    }
}