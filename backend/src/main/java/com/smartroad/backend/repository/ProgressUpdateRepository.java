package com.smartroad.backend.repository;

import com.smartroad.backend.entity.ProgressUpdate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProgressUpdateRepository extends JpaRepository<ProgressUpdate, Long> {
    List<ProgressUpdate> findByProjectIdOrderByUpdateDateDescIdDesc(Long projectId);
    void deleteByProjectId(Long projectId);
}