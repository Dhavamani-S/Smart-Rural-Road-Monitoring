package com.smartroad.backend.repository;

import com.smartroad.backend.entity.RiskAlert;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RiskAlertRepository extends JpaRepository<RiskAlert, Long> {
    void deleteByProjectId(Long projectId);
}