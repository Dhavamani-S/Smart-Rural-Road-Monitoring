package com.smartroad.backend.repository;

import com.smartroad.backend.entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {
    void deleteByProjectId(Long projectId);
}