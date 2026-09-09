package com.interviewos.session.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class GateLockedException extends RuntimeException {
    public GateLockedException(String message) {
        super(message);
    }
}
