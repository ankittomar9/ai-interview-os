package com.interviewos.session.sandbox.repository;

import com.interviewos.session.sandbox.document.ProblemDocument;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ProblemRepository extends MongoRepository<ProblemDocument, String> {

    Optional<ProblemDocument> findByProblemSlug(String problemSlug);

    Optional<ProblemDocument> findByTitleIgnoreCase(String title);
}
