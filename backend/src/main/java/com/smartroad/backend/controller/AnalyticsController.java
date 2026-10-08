package com.smartroad.backend.controller;

import com.smartroad.backend.dto.BudgetAnalysisResponse;
import com.smartroad.backend.dto.HealthIndexResponse;
import com.smartroad.backend.security.AuthUtil;
import com.smartroad.backend.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/api/projects/{projectId}/health")
    public HealthIndexResponse health(@PathVariable Long projectId, Authentication auth) {
        return analyticsService.health(projectId, auth.getName(), AuthUtil.isAdmin(auth));
    }

    @GetMapping("/api/projects/{projectId}/budget-analysis")
    public BudgetAnalysisResponse budget(@PathVariable Long projectId, Authentication auth) {
        return analyticsService.budget(projectId, auth.getName(), AuthUtil.isAdmin(auth));
    }

    @GetMapping("/api/analytics/health-summary")
    public List<HealthIndexResponse> summary(Authentication auth) {
        return analyticsService.healthSummary(auth.getName(), AuthUtil.isAdmin(auth));
    }
}