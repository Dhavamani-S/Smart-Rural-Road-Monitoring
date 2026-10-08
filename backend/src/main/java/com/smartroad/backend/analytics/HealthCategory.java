package com.smartroad.backend.analytics;

public enum HealthCategory {
    HEALTHY("Healthy"),
    NEEDS_ATTENTION("Needs Attention"),
    CRITICAL("Critical");

    private final String label;

    HealthCategory(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}