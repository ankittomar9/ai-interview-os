package com.interviewos.session.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "practice_attempts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PracticeAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    @Builder.Default
    private String userId = "local";

    @Column(name = "question_id", nullable = false)
    private String questionId;

    @Column(nullable = false)
    private String track;

    @Column(name = "language_id", nullable = false)
    private Integer languageId;

    @Column(nullable = false)
    private String verdict;

    @Column(name = "tests_passed", nullable = false)
    private Integer testsPassed;

    @Column(name = "tests_total", nullable = false)
    private Integer testsTotal;

    @Column(name = "runtime_ms")
    private Integer runtimeMs;

    @Column(name = "memory_kb")
    private Integer memoryKb;

    @Column(name = "attempt_seq", nullable = false)
    private Integer attemptSeq;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        if (userId == null) {
            userId = "local";
        }
        if (createdAt == null) {
            createdAt = Instant.now();
        }
    }
}
