package com.interviewos.session.repository;

import com.interviewos.session.entity.PracticeAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PracticeAttemptRepository extends JpaRepository<PracticeAttempt, Long> {
    List<PracticeAttempt> findByUserIdAndQuestionIdOrderByCreatedAtDesc(String userId, String questionId);
    List<PracticeAttempt> findByQuestionIdOrderByCreatedAtDesc(String questionId);
    long countByUserIdAndQuestionId(String userId, String questionId);
}
