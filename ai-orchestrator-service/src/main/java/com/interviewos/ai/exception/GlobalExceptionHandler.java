package com.interviewos.ai.exception;

import com.interviewos.ai.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AiException.class)
    public ResponseEntity<ErrorResponse> handleAiException(AiException ex, HttpServletRequest request) {
        log.warn("AI Domain Exception: provider={}, status={}, message={}",
                ex.getProvider(), ex.getStatus(), ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
                ex.getStatus().value(),
                ex.getStatus().getReasonPhrase(),
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(ex.getStatus()).body(errorResponse);
    }

    /**
     * Catches 4xx errors directly from external AI providers (e.g. 401 Unauthorized from Groq/Gemini).
     */
    @ExceptionHandler(HttpClientErrorException.class)
    public ResponseEntity<ErrorResponse> handleHttpClientError(HttpClientErrorException ex, HttpServletRequest request) {
        log.warn("Upstream AI Provider returned client error: status={}, body={}",
                ex.getStatusCode(), ex.getResponseBodyAsString());

        String message = switch (ex.getStatusCode().value()) {
            case 401 -> "Invalid or missing API Key for the selected AI Provider. Please check your credentials.";
            case 403 -> "Access forbidden by AI Provider. Please check your API account permissions.";
            case 429 -> "Rate limit exceeded on the AI Provider. Please try again in a few seconds or switch models.";
            default -> "AI Provider returned error: " + ex.getStatusText();
        };

        ErrorResponse errorResponse = ErrorResponse.of(
                ex.getStatusCode().value(),
                ex.getStatusText(),
                message,
                request.getRequestURI()
        );
        return ResponseEntity.status(ex.getStatusCode()).body(errorResponse);
    }

    /**
     * Catches connection drops or when local Ollama is not running.
     */
    @ExceptionHandler(ResourceAccessException.class)
    public ResponseEntity<ErrorResponse> handleResourceAccessException(ResourceAccessException ex, HttpServletRequest request) {
        log.error("Failed to connect to upstream service or local Ollama: {}", ex.getMessage());

        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.SERVICE_UNAVAILABLE.value(),
                "Service Unavailable",
                "Unable to connect to the AI Provider (if using local Ollama, make sure Ollama is running on localhost:11434).",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(errorResponse);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            errors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        ErrorResponse errorResponse = ErrorResponse.ofValidation(
                HttpStatus.BAD_REQUEST.value(),
                "Validation Failed",
                "Invalid request payload attributes",
                request.getRequestURI(),
                errors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        log.warn("Illegal argument: {}", ex.getMessage());
        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.BAD_REQUEST.value(),
                "Bad Request",
                ex.getMessage(),
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        log.error("Unhandled internal server error: ", ex);
        ErrorResponse errorResponse = ErrorResponse.of(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "An unexpected error occurred while processing your request.",
                request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
    }
}