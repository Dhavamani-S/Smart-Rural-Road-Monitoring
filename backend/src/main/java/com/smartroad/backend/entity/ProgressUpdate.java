package com.smartroad.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "progress_updates")
@Getter
@Setter
@NoArgsConstructor
public class ProgressUpdate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "updated_by_id", nullable = false)
    private User updatedBy;

    @Column(nullable = false)
    private int completedPercentage;

    @Column(length = 1000)
    private String remarks;

    @Column(nullable = false)
    private LocalDate updateDate;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}