package com.smartroad.backend.controller;

import com.smartroad.backend.dto.PageResponse;
import com.smartroad.backend.dto.ProjectReportResponse;
import com.smartroad.backend.dto.ProjectResponse;
import com.smartroad.backend.entity.ProjectStatus;
import com.smartroad.backend.security.AuthUtil;
import com.smartroad.backend.service.ProjectSearchService;
import com.smartroad.backend.service.ReportService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectQueryController {

    private final ProjectSearchService searchService;
    private final ReportService reportService;

    @GetMapping("/search")
    public PageResponse<ProjectResponse> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) ProjectStatus status,
            @RequestParam(required = false) Long engineerId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sort,
            @RequestParam(defaultValue = "desc") String direction,
            Authentication auth) {
        ProjectSearchService.Criteria criteria = new ProjectSearchService.Criteria(
                q, location, status, engineerId, dateFrom, dateTo, page, size, sort, direction);
        return searchService.search(criteria, auth.getName(), AuthUtil.isAdmin(auth));
    }

    @GetMapping("/{projectId}/report")
    public ProjectReportResponse report(@PathVariable Long projectId, Authentication auth) {
        return reportService.build(projectId, auth.getName(), AuthUtil.isAdmin(auth));
    }
}