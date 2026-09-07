package com.interviewos.session.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;
import java.time.Instant;

@Entity
@Table(name = "question_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(QuestionProgress.QuestionProgressId.class)
public class QuestionProgress {

    @Id
    @Column(name = "user_id", nullable = false)
    @Builder.Default
    private String userId = "local";

    @Id
    @Column(name = "question_id", nullable = false)
    private String questionId;

    @Column(name = "attempt_count", nullable = false)
    @Builder.Default
    private Integer attemptCount = 0;

    @Column(name = "solve_count", nullable = false)
    @Builder.Default
    private Integer solveCount = 0;

    @Column(name = "first_solved_at")
    private Instant firstSolvedAt;

    @Column(name = "last_attempted_at")
    private Instant lastAttemptedAt;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuestionProgressId implements Serializable {
        private String userId;
        private String questionId;
    }
}
