package com.smartroad.backend.controller;

import com.smartroad.backend.dto.ActiveRequest;
import com.smartroad.backend.dto.UserResponse;
import com.smartroad.backend.service.UserAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserAdminController {

    private final UserAdminService userAdminService;

    @GetMapping
    public List<UserResponse> list() {
        return userAdminService.listAll();
    }

    @PatchMapping("/{id}/active")
    public UserResponse setActive(@PathVariable Long id, @Valid @RequestBody ActiveRequest request) {
        return userAdminService.setActive(id, request.active());
    }
}