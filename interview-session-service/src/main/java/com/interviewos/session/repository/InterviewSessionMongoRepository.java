package com.interviewos.session.repository;

import com.interviewos.session.document.InterviewSessionDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewSessionMongoRepository extends MongoRepository<InterviewSessionDocument, String> {

    Optional<InterviewSessionDocument> findFirstBySessionIdOrderByCreatedAtDesc(Long sessionId);

    List<InterviewSessionDocument> findBySessionIdOrderByCreatedAtDesc(Long sessionId);

    List<InterviewSessionDocument> findByCandidateId(String candidateId);
}
