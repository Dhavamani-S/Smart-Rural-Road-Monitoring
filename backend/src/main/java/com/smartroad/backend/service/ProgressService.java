package com.smartroad.backend.service;

import com.smartroad.backend.dto.ProgressRequest;
import com.smartroad.backend.dto.ProgressResponse;
import com.smartroad.backend.entity.ProgressUpdate;
import com.smartroad.backend.entity.Project;
import com.smartroad.backend.entity.ProjectStatus;
import com.smartroad.backend.entity.User;
import com.smartroad.backend.exception.BadRequestException;
import com.smartroad.backend.repository.ProgressUpdateRepository;
import com.smartroad.backend.repository.ProjectRepository;
import com.smartroad.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProgressService {

    private final ProgressUpdateRepository progressUpdateRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectAccessService accessService;

    @Transactional
    public ProgressResponse add(Long projectId, ProgressRequest req, String email) {
        Project project = accessService.requireAccess(projectId, email, false);

        if (project.getStatus() == ProjectStatus.COMPLETED) {
            throw new BadRequestException("Project is already completed");
        }
        int percentage = req.completedPercentage();
        if (percentage < project.getCompletedPercentage()) {
            throw new BadRequestException("Progress cannot be lower than the current "
                    + project.getCompletedPercentage() + "%");
        }
        LocalDate date = req.updateDate() == null ? LocalDate.now() : req.updateDate();
        if (date.isAfter(LocalDate.now())) {
            throw new BadRequestException("Update date cannot be in the future");
        }
        if (date.isBefore(project.getStartDate())) {
            throw new BadRequestException("Update date cannot be before the project start date");
        }

        User engineer = userRepository.findByEmail(email).orElseThrow();
        ProgressUpdate update = new ProgressUpdate();
        update.setProject(project);
        update.setUpdatedBy(engineer);
        update.setCompletedPercentage(percentage);
        update.setRemarks(req.remarks());
        update.setUpdateDate(date);
        ProgressUpdate saved = progressUpdateRepository.save(update);

        project.setCompletedPercentage(percentage);
        if (percentage == 100) {
            project.setStatus(ProjectStatus.COMPLETED);
        } else if (percentage > 0 && project.getStatus() == ProjectStatus.NOT_STARTED) {
            project.setStatus(ProjectStatus.IN_PROGRESS);
        }
        projectRepository.save(project);

        return ProgressResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<ProgressResponse> history(Long projectId, String email, boolean isAdmin) {
        accessService.requireAccess(projectId, email, isAdmin);
        return progressUpdateRepository.findByProjectIdOrderByUpdateDateDescIdDesc(projectId)
                .stream().map(ProgressResponse::from).toList();
    }
}