package com.interviewos.session.repository;

import com.interviewos.session.entity.SessionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

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
}
