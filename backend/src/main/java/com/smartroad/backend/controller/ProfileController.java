package com.smartroad.backend.controller;

import com.smartroad.backend.dto.ChangePasswordRequest;
import com.smartroad.backend.dto.UserResponse;
import com.smartroad.backend.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
public class ProfileController {

    private final ProfileService profileService;

    @GetMapping
    public UserResponse me(Authentication auth) {
        return profileService.me(auth.getName());
    }

    @PostMapping("/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                               Authentication auth) {
        profileService.changePassword(auth.getName(), request.currentPassword(), request.newPassword());
        return ResponseEntity.noContent().build();
    }
}