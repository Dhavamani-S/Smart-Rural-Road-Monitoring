package com.smartroad.backend.service;

import com.smartroad.backend.repository.ExpenseRepository;
import com.smartroad.backend.repository.MilestoneRepository;
import com.smartroad.backend.repository.ProgressUpdateRepository;
import com.smartroad.backend.dto.ProjectRequest;
import com.smartroad.backend.dto.ProjectResponse;
import com.smartroad.backend.entity.Project;
import com.smartroad.backend.entity.Role;
import com.smartroad.backend.entity.User;
import com.smartroad.backend.exception.BadRequestException;
import com.smartroad.backend.exception.ResourceNotFoundException;
import com.smartroad.backend.repository.ProjectRepository;
import com.smartroad.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProgressUpdateRepository progressUpdateRepository;
    private final ExpenseRepository expenseRepository;
    private final MilestoneRepository milestoneRepository;
    private final PhotoService photoService;

    @Transactional
    public ProjectResponse create(ProjectRequest req) {
        validateDates(req);
        Project project = new Project();
        apply(project, req);
        return ProjectResponse.from(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse update(Long id, ProjectRequest req) {
        validateDates(req);
        Project project = findOrThrow(id);
        apply(project, req);
        return ProjectResponse.from(projectRepository.save(project));
    }

    @Transactional
    public void delete(Long id) {
        Project project = findOrThrow(id);
        photoService.deleteAllForProject(id);
        progressUpdateRepository.deleteByProjectId(id);
        expenseRepository.deleteByProjectId(id);
        milestoneRepository.deleteByProjectId(id);
        projectRepository.delete(project);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> list(String email, boolean isAdmin) {
        List<Project> projects = isAdmin
                ? projectRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                : projectRepository.findByAssignedEngineerEmail(email);
        return projects.stream().map(ProjectResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ProjectResponse get(Long id, String email, boolean isAdmin) {
        Project project = findOrThrow(id);
        if (!isAdmin) {
            User engineer = project.getAssignedEngineer();
            if (engineer == null || !engineer.getEmail().equals(email)) {
                throw new AccessDeniedException("You are not assigned to this project");
            }
        }
        return ProjectResponse.from(project);
    }

    private Project findOrThrow(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id " + id));
    }

    private void validateDates(ProjectRequest req) {
        if (!req.deadline().isAfter(req.startDate())) {
            throw new BadRequestException("Deadline must be after the start date");
        }
    }

    private void apply(Project project, ProjectRequest req) {
        project.setName(req.name().trim());
        project.setLocation(req.location().trim());
        project.setDescription(req.description());
        project.setTotalBudget(req.totalBudget());
        project.setStartDate(req.startDate());
        project.setDeadline(req.deadline());
        if (req.status() != null) {
            project.setStatus(req.status());
        }
        project.setAssignedEngineer(resolveEngineer(req.assignedEngineerId()));
    }

    private User resolveEngineer(Long engineerId) {
        if (engineerId == null) {
            return null;
        }
        User user = userRepository.findById(engineerId)
                .orElseThrow(() -> new ResourceNotFoundException("Engineer not found with id " + engineerId));
        if (user.getRole() != Role.SITE_ENGINEER || !user.isActive()) {
            throw new BadRequestException("Selected user is not an active site engineer");
        }
        return user;
    }
}