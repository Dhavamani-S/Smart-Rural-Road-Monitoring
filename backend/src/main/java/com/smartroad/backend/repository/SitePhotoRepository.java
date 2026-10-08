package com.smartroad.backend.repository;

import com.smartroad.backend.entity.SitePhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SitePhotoRepository extends JpaRepository<SitePhoto, Long> {
    List<SitePhoto> findByProjectIdOrderByUploadedAtDescIdDesc(Long projectId);
    Optional<SitePhoto> findByIdAndProjectId(Long id, Long projectId);
}