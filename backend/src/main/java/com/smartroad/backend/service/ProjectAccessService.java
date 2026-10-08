package com.smartroad.backend.service;

import com.smartroad.backend.entity.Project;
import com.smartroad.backend.entity.User;
import com.smartroad.backend.exception.ResourceNotFoundException;
import com.smartroad.backend.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProjectAccessService {

    private final ProjectRepository projectRepository;

    /** Returns the project, or throws 404 (missing) / 403 (engineer not assigned). Call inside a transaction. */
    public Project requireAccess(Long projectId, String email, boolean isAdmin) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id " + projectId));
        if (!isAdmin) {
            User engineer = project.getAssignedEngineer();
            if (engineer == null || !engineer.getEmail().equals(email)) {
                throw new AccessDeniedException("You are not assigned to this project");
            }
        }
        return project;
    }
}