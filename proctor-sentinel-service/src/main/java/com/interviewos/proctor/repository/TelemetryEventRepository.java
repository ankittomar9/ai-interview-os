package com.interviewos.proctor.repository;

import com.interviewos.proctor.entity.TelemetryEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TelemetryEventRepository extends JpaRepository<TelemetryEvent, Long> {
    List<TelemetryEvent> findBySessionIdOrderByTimestampAsc(Long sessionId);
    long countBySessionId(Long sessionId);
}