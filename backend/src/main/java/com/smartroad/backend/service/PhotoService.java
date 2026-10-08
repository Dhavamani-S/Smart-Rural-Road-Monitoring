package com.smartroad.backend.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.smartroad.backend.dto.PhotoResponse;
import com.smartroad.backend.entity.Project;
import com.smartroad.backend.entity.SitePhoto;
import com.smartroad.backend.entity.User;
import com.smartroad.backend.exception.BadRequestException;
import com.smartroad.backend.exception.ResourceNotFoundException;
import com.smartroad.backend.exception.StorageException;
import com.smartroad.backend.repository.SitePhotoRepository;
import com.smartroad.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PhotoService {

    private final SitePhotoRepository sitePhotoRepository;
    private final UserRepository userRepository;
    private final ProjectAccessService accessService;
    private final Cloudinary cloudinary;

    @Value("${cloudinary.cloud-name:}")
    private String cloudName;

    @Value("${cloudinary.api-secret:}")
    private String apiSecret;

    @Value("${app.photos.max-size-bytes:5242880}")
    private long maxSizeBytes;

    @Transactional
    public PhotoResponse upload(Long projectId, MultipartFile file, String caption, String email) {
        Project project = accessService.requireAccess(projectId, email, false);
        byte[] bytes = validate(file);
        String cleanCaption = cleanCaption(caption);
        if (!isConfigured()) {
            throw new StorageException("Photo storage is not configured on the server");
        }
        User uploader = userRepository.findByEmail(email).orElseThrow();

        Map<?, ?> result;
        try {
            result = cloudinary.uploader().upload(bytes, ObjectUtils.asMap(
                    "folder", "smartroad/project-" + projectId,
                    "resource_type", "image"));
        } catch (Exception e) {
            log.error("Cloudinary upload failed for project {}", projectId, e);
            throw new StorageException("Photo upload failed. Please try again later");
        }

        String url = (String) result.get("secure_url");
        String publicId = (String) result.get("public_id");
        if (url == null || publicId == null) {
            throw new StorageException("Photo upload failed. Please try again later");
        }

        SitePhoto photo = new SitePhoto();
        photo.setProject(project);
        photo.setUploadedBy(uploader);
        photo.setImageUrl(url);
        photo.setPublicId(publicId);
        photo.setCaption(cleanCaption);
        try {
            return PhotoResponse.from(sitePhotoRepository.save(photo));
        } catch (RuntimeException e) {
            destroyQuietly(publicId);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<PhotoResponse> list(Long projectId, String email, boolean isAdmin) {
        accessService.requireAccess(projectId, email, isAdmin);
        return sitePhotoRepository.findByProjectIdOrderByUploadedAtDescIdDesc(projectId)
                .stream().map(PhotoResponse::from).toList();
    }

    @Transactional
    public void delete(Long projectId, Long photoId, String email, boolean isAdmin) {
        accessService.requireAccess(projectId, email, isAdmin);
        SitePhoto photo = sitePhotoRepository.findByIdAndProjectId(photoId, projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Photo not found in this project"));
        if (!isAdmin && !photo.getUploadedBy().getEmail().equals(email)) {
            throw new AccessDeniedException("You can only delete photos you uploaded");
        }
        String publicId = photo.getPublicId();
        sitePhotoRepository.delete(photo);
        destroyQuietly(publicId);
    }

    /** Called when a whole project is deleted. */
    @Transactional
    public void deleteAllForProject(Long projectId) {
        List<SitePhoto> photos = sitePhotoRepository.findByProjectIdOrderByUploadedAtDescIdDesc(projectId);
        for (SitePhoto photo : photos) {
            destroyQuietly(photo.getPublicId());
        }
        sitePhotoRepository.deleteAll(photos);
    }

    private byte[] validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Photo file is required");
        }
        if (file.getSize() > maxSizeBytes) {
            throw new BadRequestException("Photo must be at most " + (maxSizeBytes / (1024 * 1024)) + " MB");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw new BadRequestException("Could not read the uploaded file");
        }
        if (!hasImageSignature(bytes)) {
            throw new BadRequestException("Only JPEG, PNG or WebP images are allowed");
        }
        return bytes;
    }

    private boolean hasImageSignature(byte[] b) {
        if (b.length < 12) {
            return false;
        }
        boolean jpeg = (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
        boolean png = (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
        boolean webp = b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
        return jpeg || png || webp;
    }

    private String cleanCaption(String caption) {
        if (caption == null || caption.isBlank()) {
            return null;
        }
        String trimmed = caption.trim();
        if (trimmed.length() > 300) {
            throw new BadRequestException("Caption must be at most 300 characters");
        }
        return trimmed;
    }

    private boolean isConfigured() {
        return cloudName != null && !cloudName.isBlank() && apiSecret != null && !apiSecret.isBlank();
    }

    private void destroyQuietly(String publicId) {
        if (!isConfigured() || publicId == null) {
            return;
        }
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            log.warn("Could not delete image {} from Cloudinary", publicId, e);
        }
    }
}