package com.interviewos.evaluation.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "progress_ledger")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProgressLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "candidate_id", nullable = false)
    private String candidateId;

    @Column(name = "track", nullable = false)
    private String track;

    @Column(name = "session_id", nullable = false)
    private Long sessionId;

    @Column(name = "session_date", nullable = false)
    private LocalDate sessionDate;

    @Column(name = "rubric_schema", nullable = false)
    private String rubricSchema;

    @Column(name = "overall_score", nullable = false)
    private Integer overallScore;

    @Lob
    @Column(name = "dimension_scores", columnDefinition = "TEXT")
    private String dimensionScores;

    @Column(name = "algorithmic_reasoning_score")
    private Integer algorithmicReasoningScore;

    @Column(name = "code_quality_score")
    private Integer codeQualityScore;

    @Column(name = "execution_efficiency_score")
    private Integer executionEfficiencyScore;

    @Column(name = "communication_score")
    private Integer communicationScore;

    @Column(name = "professionalism_score")
    private Integer professionalismScore;

    @Column(name = "leadership_score")
    private Integer leadershipScore;

    @Column(name = "conflict_resolution_score")
    private Integer conflictResolutionScore;

    @Column(name = "teamwork_score")
    private Integer teamworkScore;

    @Column(name = "adaptability_score")
    private Integer adaptabilityScore;

    @Column(name = "communication_behavioral_score")
    private Integer communicationBehavioralScore;

    @Builder.Default
    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
