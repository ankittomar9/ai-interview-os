package com.interviewos.questionbank.repository;

import com.interviewos.questionbank.document.QuestionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuestionRepository extends MongoRepository<QuestionDocument, String> {

    Optional<QuestionDocument> findBySlug(String slug);

    List<QuestionDocument> findByTrackAndDifficultyAndStatus(String track, String difficulty, String status);

    List<QuestionDocument> findByTrackAndStatus(String track, String status);

    List<QuestionDocument> findByStatus(String status);
}
