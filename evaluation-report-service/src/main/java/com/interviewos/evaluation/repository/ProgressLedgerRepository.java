package com.interviewos.evaluation.repository;

import com.interviewos.evaluation.entity.ProgressLedger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProgressLedgerRepository extends JpaRepository<ProgressLedger, Long> {

    List<ProgressLedger> findByCandidateIdOrderBySessionDateAsc(String candidateId);

    List<ProgressLedger> findByCandidateIdAndTrackOrderBySessionDateAsc(String candidateId, String track);

    List<ProgressLedger> findByCandidateIdOrderByCreatedAtDesc(String candidateId);
}
