package com.interviewos.session.repository;

import com.interviewos.session.document.ResumeDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResumeMongoRepository extends MongoRepository<ResumeDocument, String> {
    List<ResumeDocument> findByCandidateId(String candidateId);
    List<ResumeDocument> findByCandidateNameIgnoreCase(String candidateName);
}
