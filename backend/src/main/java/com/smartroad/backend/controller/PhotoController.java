package com.smartroad.backend.controller;

import com.smartroad.backend.dto.PhotoResponse;
import com.smartroad.backend.security.AuthUtil;
import com.smartroad.backend.service.PhotoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/photos")
@RequiredArgsConstructor
public class PhotoController {

    private final PhotoService photoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SITE_ENGINEER')")
    public ResponseEntity<PhotoResponse> upload(@PathVariable Long projectId,
                                                @RequestPart(value = "file", required = false) MultipartFile file,
                                                @RequestParam(value = "caption", required = false) String caption,
                                                Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(photoService.upload(projectId, file, caption, auth.getName()));
    }

    @GetMapping
    public List<PhotoResponse> list(@PathVariable Long projectId, Authentication auth) {
        return photoService.list(projectId, auth.getName(), AuthUtil.isAdmin(auth));
    }

    @DeleteMapping("/{photoId}")
    public ResponseEntity<Void> delete(@PathVariable Long projectId, @PathVariable Long photoId,
                                       Authentication auth) {
        photoService.delete(projectId, photoId, auth.getName(), AuthUtil.isAdmin(auth));
        return ResponseEntity.noContent().build();
    }
}