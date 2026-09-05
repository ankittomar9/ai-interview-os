package com.interviewos.session.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class VerificationRequiredException extends IllegalStateException {
    public VerificationRequiredException(String message) {
        super(message);
    }
}
