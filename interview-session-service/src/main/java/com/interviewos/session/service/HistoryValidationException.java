package com.interviewos.session.service;

import lombok.Getter;

@Getter
public class HistoryValidationException extends RuntimeException {
    private final String code;

    public HistoryValidationException(String message, String code) {
        super(message);
        this.code = code;
    }
}
