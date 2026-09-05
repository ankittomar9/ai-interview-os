package com.interviewos.session.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "session_verifications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionVerification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "session_id", nullable = false, unique = true)
    private Long sessionId;

    @Column(name = "camera_status", nullable = false)
    private String cameraStatus;

    @Column(name = "mic_status", nullable = false)
    private String micStatus;

    @Column(name = "screen_status", nullable = false)
    private String screenStatus;

    @Column(name = "screen_scope", nullable = false)
    private String screenScope;

    @Column(name = "screen_label")
    private String screenLabel;

    @Column(nullable = false)
    private boolean consent;

    @Column(nullable = false)
    private String outcome;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(name = "verified_at")
    private Instant verifiedAt;

    @PrePersist
    public void prePersist() {
        if (verifiedAt == null) {
            verifiedAt = Instant.now();
        }
    }
}
