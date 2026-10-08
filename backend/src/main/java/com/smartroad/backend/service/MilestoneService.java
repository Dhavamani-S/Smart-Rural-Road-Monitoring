package com.smartroad.backend.service;

import com.smartroad.backend.dto.MilestoneRequest;
import com.smartroad.backend.dto.MilestoneResponse;
import com.smartroad.backend.entity.Milestone;
import com.smartroad.backend.entity.Project;
import com.smartroad.backend.exception.BadRequestException;
import com.smartroad.backend.exception.ResourceNotFoundException;
import com.smartroad.backend.repository.MilestoneRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ProjectAccessService accessService;

    @Transactional
    public MilestoneResponse create(Long projectId, MilestoneRequest req, String email) {
        Project project = accessService.requireAccess(projectId, email, true);
        String title = req.title().trim();
        if (req.targetDate().isBefore(project.getStartDate()) || req.targetDate().isAfter(project.getDeadline())) {
            throw new BadRequestException("Milestone date must be between the project start date and deadline");
        }
        if (milestoneRepository.existsByProjectIdAndTitleIgnoreCase(projectId, title)) {
            throw new BadRequestException("A milestone with this title already exists in the project");
        }
        Milestone milestone = new Milestone();
        milestone.setProject(project);
        milestone.setTitle(title);
        milestone.setTargetDate(req.targetDate());
        return MilestoneResponse.from(milestoneRepository.save(milestone));
    }

    @Transactional(readOnly = true)
    public List<MilestoneResponse> list(Long projectId, String email, boolean isAdmin) {
        accessService.requireAccess(projectId, email, isAdmin);
        return milestoneRepository.findByProjectIdOrderByTargetDateAsc(projectId)
                .stream().map(MilestoneResponse::from).toList();
    }

    @Transactional
    public MilestoneResponse complete(Long projectId, Long milestoneId, String email) {
        accessService.requireAccess(projectId, email, false);
        Milestone milestone = findInProject(projectId, milestoneId);
        if (milestone.isCompleted()) {
            throw new BadRequestException("Milestone is already completed");
        }
        milestone.setCompleted(true);
        milestone.setCompletedDate(LocalDate.now());
        return MilestoneResponse.from(milestoneRepository.save(milestone));
    }

    @Transactional
    public void delete(Long projectId, Long milestoneId, String email) {
        accessService.requireAccess(projectId, email, true);
        milestoneRepository.delete(findInProject(projectId, milestoneId));
    }

    private Milestone findInProject(Long projectId, Long milestoneId) {
        return milestoneRepository.findByIdAndProjectId(milestoneId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Milestone not found in this project"));
    }
}