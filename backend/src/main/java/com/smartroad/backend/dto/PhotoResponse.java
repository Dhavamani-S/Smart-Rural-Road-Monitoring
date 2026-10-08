package com.smartroad.backend.dto;

import com.smartroad.backend.entity.SitePhoto;

import java.time.LocalDateTime;

public record PhotoResponse(
        Long id,
        Long projectId,
        String imageUrl,
        String caption,
        Long uploadedById,
        String uploadedByName,
        LocalDateTime uploadedAt) {

    public static PhotoResponse from(SitePhoto p) {
        return new PhotoResponse(p.getId(), p.getProject().getId(), p.getImageUrl(), p.getCaption(),
                p.getUploadedBy().getId(), p.getUploadedBy().getFullName(), p.getUploadedAt());
    }
}