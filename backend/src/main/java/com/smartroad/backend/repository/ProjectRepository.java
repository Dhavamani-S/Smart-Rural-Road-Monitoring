package com.smartroad.backend.repository;

import com.smartroad.backend.entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByAssignedEngineerEmail(String email);
}