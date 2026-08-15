package com.interviewos.session.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.interviewos.session.model.MessageType;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "session_messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SessionMessage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    @JsonIgnore
    private InterviewSession session;

    @Column(nullable = false)
    private String senderRole; // "AI" or "CANDIDATE"

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType messageType;

    @Lob
    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String codeSnippet;

    @Column(nullable = false)
    private Instant timestamp;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = Instant.now();
        }
    }
}