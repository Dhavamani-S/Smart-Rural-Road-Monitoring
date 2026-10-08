package com.smartroad.backend.service;

import com.smartroad.backend.dto.ProjectResponse;
import com.smartroad.backend.entity.Project;
import com.smartroad.backend.entity.ProjectStatus;
import com.smartroad.backend.entity.Role;
import com.smartroad.backend.entity.User;
import com.smartroad.backend.exception.BadRequestException;
import com.smartroad.backend.exception.ResourceNotFoundException;
import com.smartroad.backend.repository.ProjectRepository;
import com.smartroad.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ProjectWorkflowService {

    private final ProjectAccessService accessService;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    /** Engineers may pause a project (ON_HOLD) or resume a paused one (IN_PROGRESS). */
    @Transactional
    public ProjectResponse changeStatus(Long projectId, ProjectStatus target, String email) {
        Project project = accessService.requireAccess(projectId, email, false);
        ProjectStatus current = project.getStatus();
        if (current == ProjectStatus.COMPLETED) {
            throw new BadRequestException("A completed project cannot change status");
        }
        if (target == ProjectStatus.ON_HOLD) {
            if (current == ProjectStatus.ON_HOLD) {
                throw new BadRequestException("The project is already on hold");
            }
            project.setStatus(ProjectStatus.ON_HOLD);
        } else if (target == ProjectStatus.IN_PROGRESS) {
            if (current != ProjectStatus.ON_HOLD) {
                throw new BadRequestException("Only a project that is on hold can be resumed");
            }
            project.setStatus(project.getCompletedPercentage() > 0
                    ? ProjectStatus.IN_PROGRESS : ProjectStatus.NOT_STARTED);
        } else {
            throw new BadRequestException("Engineers can only set ON_HOLD, or IN_PROGRESS to resume a paused "
                    + "project. Completed and Delayed are set automatically.");
        }
        return ProjectResponse.from(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse assign(Long projectId, Long engineerId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id " + projectId));
        if (engineerId == null) {
            project.setAssignedEngineer(null);
        } else {
            User user = userRepository.findById(engineerId)
                    .orElseThrow(() -> new ResourceNotFoundException("Engineer not found with id " + engineerId));
            if (user.getRole() != Role.SITE_ENGINEER || !user.isActive()) {
                throw new BadRequestException("Selected user is not an active site engineer");
            }
            project.setAssignedEngineer(user);
        }
        return ProjectResponse.from(projectRepository.save(project));
    }
}