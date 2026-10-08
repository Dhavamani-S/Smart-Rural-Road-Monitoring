package com.smartroad.backend.controller;

import com.smartroad.backend.dto.DashboardResponse;
import com.smartroad.backend.security.AuthUtil;
import com.smartroad.backend.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/api/dashboard")
    public DashboardResponse dashboard(Authentication auth) {
        return dashboardService.build(auth.getName(), AuthUtil.isAdmin(auth));
    }
}