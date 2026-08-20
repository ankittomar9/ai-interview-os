package com.interviewos.session.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * MongoDB Document representation of an Interview Session with full multi-turn transcripts.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "interview_sessions")
public class InterviewSessionDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private Long sessionId;

    @Indexed
    private String candidateId;

    private String candidateName;

    private String targetRoleTitle;

    private String interviewTrack;

    private String seniorityLevel;

    private String targetCompany;

    private String resumeId;

    private String status;

    @Builder.Default
    private List<TranscriptTurn> transcript = new ArrayList<>();

    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    private LocalDateTime startedAt;

    private LocalDateTime completedAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TranscriptTurn {
        private int turnNumber;
        private String senderRole; // "CANDIDATE" | "AI"
        private String messageType; // "EXPLANATION" | "FEEDBACK" | "QUESTION"
        private String content;
        private String codeSnippet;
        private String scratchpadSnapshot;
        private LocalDateTime timestamp;
    }
}
