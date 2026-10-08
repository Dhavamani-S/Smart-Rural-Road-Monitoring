package com.smartroad.backend.controller;

import com.smartroad.backend.dto.CreateEngineerRequest;
import com.smartroad.backend.dto.UserResponse;
import com.smartroad.backend.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class UserController {

    private final UserService userService;

    @PostMapping("/engineers")
    public ResponseEntity<UserResponse> createEngineer(@Valid @RequestBody CreateEngineerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(userService.createEngineer(request));
    }

    @GetMapping("/engineers")
    public List<UserResponse> listEngineers() {
        return userService.listEngineers();
    }
}