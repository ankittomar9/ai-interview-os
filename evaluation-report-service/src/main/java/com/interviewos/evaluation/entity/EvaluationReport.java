package com.interviewos.evaluation.entity;

import com.interviewos.evaluation.model.HiringVerdict;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "evaluation_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvaluationReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private Long sessionId;

    @Column(nullable = false)
    private String candidateId;

    private String roleTitle;
    private String track;
    private String difficulty;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private HiringVerdict verdict;

    private int overallScore; // 0 - 100
    private int technicalAccuracyScore;
    private int problemSolvingScore;
    private int communicationClarityScore;
    private int codeQualityScore;
    private int integrityScore;
    private Integer requirementsClarificationScore;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String executiveSummary;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String rubricJson;

    @Builder.Default
    private Boolean rubricLlmGenerated = false;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "report_strengths", joinColumns = @JoinColumn(name = "report_id"))
    private List<String> keyStrengths;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "report_weaknesses", joinColumns = @JoinColumn(name = "report_id"))
    private List<String> areasForImprovement;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "report_study_plan", joinColumns = @JoinColumn(name = "report_id"))
    private List<String> sevenDayStudyPlan;

    private Instant generatedAt;

    @PrePersist
    protected void onCreate() {
        this.generatedAt = Instant.now();
    }
}