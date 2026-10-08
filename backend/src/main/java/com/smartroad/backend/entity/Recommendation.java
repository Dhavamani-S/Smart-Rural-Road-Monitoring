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
@Table(name = "recommendations")
@Getter
@Setter
@NoArgsConstructor
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private Project project;

    @Column(nullable = false, length = 60)
    private String ruleCode;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RecommendationType type;

    @Column(nullable = false, length = 300)
    private String issueDetected;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Severity severity;

    @Column(nullable = false, length = 1000)
    private String reason;

    @Column(nullable = false, length = 1000)
    private String recommendedAction;

    @Column(nullable = false, length = 500)
    private String triggeredRule;

    @Column(nullable = false)
    private LocalDate generatedOn;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}