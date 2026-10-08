package com.smartroad.backend;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthCheckController {
    @GetMapping("/api/ping")
    public String ping() {
        return "SmartRoad backend is running";
    }
}