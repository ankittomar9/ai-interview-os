package com.interviewos.session.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "candidate_profile")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    @Builder.Default
    private String userId = "local";

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "target_role")
    private String targetRole;

    @Column(name = "target_company")
    private String targetCompany;

    @Column(name = "job_description", columnDefinition = "TEXT")
    private String jobDescription;

    @Column(name = "resume_text", columnDefinition = "TEXT")
    private String resumeText;

    @Column(name = "resume_pdf_path")
    private String resumePdfPath;

    @Column(name = "persona")
    private String persona;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        if (this.updatedAt == null) {
            this.updatedAt = now;
        }
        if (this.userId == null || this.userId.isBlank()) {
            this.userId = "local";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = Instant.now();
    }
}
