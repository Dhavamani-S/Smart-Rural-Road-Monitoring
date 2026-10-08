package com.smartroad.backend.controller;

import com.smartroad.backend.dto.MilestoneRequest;
import com.smartroad.backend.dto.MilestoneResponse;
import com.smartroad.backend.security.AuthUtil;
import com.smartroad.backend.service.MilestoneService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService milestoneService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MilestoneResponse> create(@PathVariable Long projectId,
                                                    @Valid @RequestBody MilestoneRequest request,
                                                    Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(milestoneService.create(projectId, request, auth.getName()));
    }

    @GetMapping
    public List<MilestoneResponse> list(@PathVariable Long projectId, Authentication auth) {
        return milestoneService.list(projectId, auth.getName(), AuthUtil.isAdmin(auth));
    }

    @PatchMapping("/{milestoneId}/complete")
    @PreAuthorize("hasRole('SITE_ENGINEER')")
    public MilestoneResponse complete(@PathVariable Long projectId, @PathVariable Long milestoneId,
                                      Authentication auth) {
        return milestoneService.complete(projectId, milestoneId, auth.getName());
    }

    @DeleteMapping("/{milestoneId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long projectId, @PathVariable Long milestoneId,
                                       Authentication auth) {
        milestoneService.delete(projectId, milestoneId, auth.getName());
        return ResponseEntity.noContent().build();
    }
}