package com.smartroad.backend.controller;

import com.smartroad.backend.dto.LoginRequest;
import com.smartroad.backend.dto.LoginResponse;
import com.smartroad.backend.entity.User;
import com.smartroad.backend.repository.UserRepository;
import com.smartroad.backend.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final JwtService jwtService;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.password()));
        User user = userRepository.findByEmail(request.email()).orElseThrow();
        String token = jwtService.generateToken(user.getEmail(), user.getRole().name());
        return ResponseEntity.ok(new LoginResponse(token, user.getEmail(), user.getFullName(), user.getRole().name()));
    }
}