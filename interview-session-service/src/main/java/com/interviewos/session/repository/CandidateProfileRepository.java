package com.interviewos.session.repository;

import com.interviewos.session.entity.CandidateProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CandidateProfileRepository extends JpaRepository<CandidateProfile, Long> {

    Optional<CandidateProfile> findByUserId(String userId);

    default Optional<CandidateProfile> findLocalProfile() {
        return findByUserId("local");
    }
}
