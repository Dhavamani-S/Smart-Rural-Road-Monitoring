package com.smartroad.backend.controller;

import com.smartroad.backend.dto.ExpenseRequest;
import com.smartroad.backend.dto.ExpenseResponse;
import com.smartroad.backend.security.AuthUtil;
import com.smartroad.backend.service.ExpenseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects/{projectId}/expenses")
@RequiredArgsConstructor
public class ExpenseController {

    private final ExpenseService expenseService;

    @PostMapping
    @PreAuthorize("hasRole('SITE_ENGINEER')")
    public ResponseEntity<ExpenseResponse> add(@PathVariable Long projectId,
                                               @Valid @RequestBody ExpenseRequest request,
                                               Authentication auth) {
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.add(projectId, request, auth.getName()));
    }

    @GetMapping
    public List<ExpenseResponse> history(@PathVariable Long projectId, Authentication auth) {
        return expenseService.history(projectId, auth.getName(), AuthUtil.isAdmin(auth));
    }
}