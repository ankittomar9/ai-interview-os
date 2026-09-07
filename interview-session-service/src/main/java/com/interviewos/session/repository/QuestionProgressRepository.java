package com.interviewos.session.repository;

import com.interviewos.session.entity.QuestionProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionProgressRepository extends JpaRepository<QuestionProgress, QuestionProgress.QuestionProgressId> {
    Optional<QuestionProgress> findByUserIdAndQuestionId(String userId, String questionId);
    List<QuestionProgress> findByUserId(String userId);
}
