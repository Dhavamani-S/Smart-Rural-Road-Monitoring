package com.smartroad.backend.repository;

import com.smartroad.backend.entity.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByProjectIdOrderByTargetDateAsc(Long projectId);
    Optional<Milestone> findByIdAndProjectId(Long id, Long projectId);
    boolean existsByProjectIdAndTitleIgnoreCase(Long projectId, String title);
    void deleteByProjectId(Long projectId);
}