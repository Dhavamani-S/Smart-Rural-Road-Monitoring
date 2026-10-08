package com.smartroad.backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "site_photos")
@Getter
@Setter
@NoArgsConstructor
public class SitePhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploaded_by_id", nullable = false)
    private User uploadedBy;

    @Column(nullable = false, length = 1000)
    private String imageUrl;

    @Column(nullable = false, length = 300)
    private String publicId;

    @Column(length = 300)
    private String caption;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime uploadedAt;
}