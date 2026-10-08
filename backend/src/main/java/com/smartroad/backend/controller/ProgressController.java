package com.smartroad.backend.controller;

import com.smartroad.backend.dto.ProgressRequest;
import com.smartroad.backend.dto.ProgressResponse;
import com.smartroad.backend.security.AuthUtil;
import com.smartroad.backend.service.ProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/progress")
@RequiredArgsConstructor
public class ProgressController {

    private final ProgressService progressService;

    @PostMapping
    @PreAuthorize("hasRole('SITE_ENGINEER')")
    public ResponseEntity<ProgressResponse> add(@PathVariable Long projectId,
                                                @Valid @RequestBody ProgressRequest request,
                                                Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(progressService.add(projectId, request, auth.getName()));
    }

    @GetMapping
    public List<ProgressResponse> history(@PathVariable Long projectId, Authentication auth) {
        return progressService.history(projectId, auth.getName(), AuthUtil.isAdmin(auth));
    }
}