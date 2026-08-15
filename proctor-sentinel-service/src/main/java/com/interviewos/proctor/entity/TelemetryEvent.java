package com.interviewos.proctor.entity;

import com.interviewos.proctor.model.TelemetryEventType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "telemetry_events")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TelemetryEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sessionId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TelemetryEventType eventType;

    private Integer characterCount;

    private Long durationSeconds;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String metadataDetails;

    private boolean isFlagged;

    @Column(nullable = false)
    private Instant timestamp;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }
}