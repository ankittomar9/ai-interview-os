package com.interviewos.session.repository;

import com.interviewos.session.entity.SessionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;

@Repository
public interface SessionQuestionRepository extends JpaRepository<SessionQuestion, Long> {

    List<SessionQuestion> findBySessionIdOrderByDisplayOrderAsc(Long sessionId);

    List<SessionQuestion> findByQuestionSlugOrderByAttemptedAtDesc(String questionSlug);

    long countByQuestionSlugAndVerdict(String questionSlug, String verdict);

    long countByQuestionSlugAndVerdictNot(String questionSlug, String verdict);

    boolean existsBySessionId(Long sessionId);

    void deleteBySessionId(Long sessionId);

    List<SessionQuestion> findBySessionIdInOrderByAttemptedAtDesc(List<Long> sessionIds);

    List<SessionQuestion> findAllByOrderByAttemptedAtDesc();

    interface ExposureProjection {
        String getSlug();
        Long getTimesServed();
        Instant getLastServedAt();
    }

    @Query(value = "SELECT sq.question_slug AS slug, " +
            "COUNT(sq.id) AS timesServed, " +
            "MAX(s.created_at) AS lastServedAt " +
            "FROM session_questions sq " +
            "JOIN interview_sessions s ON sq.session_id = s.id " +
            "WHERE s.candidate_id = :candidateId " +
            "AND (:track IS NULL OR s.track = :track) " +
            "AND (s.session_mode IS NULL OR UPPER(s.session_mode) != 'PLAYGROUND') " +
            "GROUP BY sq.question_slug", nativeQuery = true)
    List<ExposureProjection> findExposureByCandidateAndTrack(
            @Param("candidateId") String candidateId,
            @Param("track") String track
    );

    @Query(value = "SELECT sq.* FROM session_questions sq " +
            "JOIN interview_sessions s ON sq.session_id = s.id " +
            "WHERE s.candidate_id = :candidateId " +
            "AND UPPER(sq.verdict) IN ('PASSED', 'FAILED') " +
            "AND COALESCE(sq.attempted_at, sq.updated_at) >= :fromIncl " +
            "AND COALESCE(sq.attempted_at, sq.updated_at) < :toExcl " +
            "ORDER BY COALESCE(sq.attempted_at, sq.updated_at) ASC, sq.id ASC", nativeQuery = true)
    List<SessionQuestion> findAttemptedByCandidateAndWindow(
            @Param("candidateId") String candidateId,
            @Param("fromIncl") Instant fromIncl,
            @Param("toExcl") Instant toExcl
    );
}
