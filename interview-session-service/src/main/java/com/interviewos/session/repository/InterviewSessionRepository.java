package com.interviewos.session.repository;

import com.interviewos.session.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByCandidateIdOrderByCreatedAtDesc(String candidateId);
    List<InterviewSession> findByCandidateId(String candidateId);
}