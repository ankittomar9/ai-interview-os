package com.interviewos.ai.exception;

import com.interviewos.ai.model.ModelProvider;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * Base and specialized domain exceptions for AI provider communications.
 */
@Getter
public class AiException extends RuntimeException {

    private final ModelProvider provider;
    private final HttpStatus status;

    public AiException(ModelProvider provider, HttpStatus status, String message) {
        super(String.format("[%s] %s", provider != null ? provider.name() : "GENERAL", message));
        this.provider = provider;
        this.status = status;
    }

    public AiException(ModelProvider provider, HttpStatus status, String message, Throwable cause) {
        super(String.format("[%s] %s", provider != null ? provider.name() : "GENERAL", message), cause);
        this.provider = provider;
        this.status = status;
    }

    public static class InvalidApiKeyException extends AiException {
        public InvalidApiKeyException(ModelProvider provider, String message) {
            super(provider, HttpStatus.UNAUTHORIZED, message);
        }
    }

    public static class RateLimitException extends AiException {
        public RateLimitException(ModelProvider provider, String message) {
            super(provider, HttpStatus.TOO_MANY_REQUESTS, message);
        }
    }

    public static class ProviderUnavailableException extends AiException {
        public ProviderUnavailableException(ModelProvider provider, String message, Throwable cause) {
            super(provider, HttpStatus.SERVICE_UNAVAILABLE, message, cause);
        }
    }

    public static class ResponseParseException extends AiException {
        public ResponseParseException(ModelProvider provider, String message, Throwable cause) {
            super(provider, HttpStatus.UNPROCESSABLE_ENTITY, message, cause);
        }
    }
}