package com.smartroad.backend.controller;

import com.smartroad.backend.dto.ProjectRequest;
import com.smartroad.backend.dto.ProjectResponse;
import com.smartroad.backend.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProjectResponse> create(@Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ProjectResponse update(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        return projectService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        projectService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<ProjectResponse> list(Authentication auth) {
        return projectService.list(auth.getName(), isAdmin(auth));
    }

    @GetMapping("/{id}")
    public ProjectResponse get(@PathVariable Long id, Authentication auth) {
        return projectService.get(id, auth.getName(), isAdmin(auth));
    }

    private boolean isAdmin(Authentication auth) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
    }
}