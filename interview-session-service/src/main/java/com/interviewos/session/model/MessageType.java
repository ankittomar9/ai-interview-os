package com.interviewos.session.model;

public enum MessageType {
    QUESTION,
    EXPLANATION,
    CODE_SUBMISSION,
    CODE_EXECUTION,
    ENGINE_ERROR,
    HINT,
    FEEDBACK,
    SYSTEM_EVENT,
    SYSTEM_DESIGN;

    @com.fasterxml.jackson.annotation.JsonCreator
    public static MessageType fromString(String value) {
        if (value == null || value.isBlank()) {
            return EXPLANATION;
        }
        try {
            return MessageType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return EXPLANATION;
        }
    }
}