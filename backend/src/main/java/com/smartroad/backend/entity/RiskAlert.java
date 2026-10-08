package com.smartroad.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "risk_alerts")
@Getter
@Setter
@NoArgsConstructor
public class RiskAlert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertCategory category;

    @Column(nullable = false, length = 60)
    private String ruleCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Column(nullable = false, length = 300)
    private String title;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Column(nullable = false, length = 1000)
    private String suggestedAction;

    /** true = based on a recorded fact; false = a risk indicator for review. */
    @Column(nullable = false)
    private boolean confirmed;

    @Column(nullable = false)
    private LocalDate generatedOn;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}