package com.smartroad.backend.controller;

import com.smartroad.backend.dto.AssignmentRequest;
import com.smartroad.backend.dto.ProjectResponse;
import com.smartroad.backend.dto.StatusChangeRequest;
import com.smartroad.backend.service.ProjectWorkflowService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects/{projectId}")
@RequiredArgsConstructor
public class ProjectWorkflowController {

    private final ProjectWorkflowService workflowService;

    @PatchMapping("/status")
    @PreAuthorize("hasRole('SITE_ENGINEER')")
    public ProjectResponse changeStatus(@PathVariable Long projectId,
                                        @Valid @RequestBody StatusChangeRequest request,
                                        Authentication auth) {
        return workflowService.changeStatus(projectId, request.status(), auth.getName());
    }

    @PutMapping("/assignment")
    @PreAuthorize("hasRole('ADMIN')")
    public ProjectResponse assign(@PathVariable Long projectId, @RequestBody AssignmentRequest request) {
        return workflowService.assign(projectId, request.engineerId());
    }
}