package com.interviewos.session.dto;

import com.interviewos.session.model.MessageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AddMessageRequest(
        @NotBlank(message = "Sender role is required (AI or CANDIDATE)")
        String senderRole,

        @NotNull(message = "Message type is required")
        MessageType messageType,

        @NotBlank(message = "Content cannot be blank")
        String content,

        String codeSnippet
) {}