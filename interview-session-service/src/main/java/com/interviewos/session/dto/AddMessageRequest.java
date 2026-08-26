package com.interviewos.session.dto;

import com.interviewos.session.model.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public record AddMessageRequest(
        @NotBlank(message = "Sender role is required (AI or CANDIDATE)")
        String senderRole,

        @NotNull(message = "Message type is required")
        MessageType messageType,

        @NotBlank(message = "Content cannot be blank")
        String content,

        String codeSnippet,

        Map<String, String> metadata,

        IntegritySignals integritySignals
) {
    public AddMessageRequest(String senderRole, MessageType messageType, String content, String codeSnippet) {
        this(senderRole, messageType, content, codeSnippet, null, null);
    }

    public AddMessageRequest(String senderRole, MessageType messageType, String content, String codeSnippet, Map<String, String> metadata) {
        this(senderRole, messageType, content, codeSnippet, metadata, null);
    }
}