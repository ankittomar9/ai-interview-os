package com.interviewos.session.repository;

import com.interviewos.session.entity.SessionVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SessionVerificationRepository extends JpaRepository<SessionVerification, Long> {
    Optional<SessionVerification> findBySessionId(Long sessionId);
}
