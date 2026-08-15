package com.interviewos.proctor.model;

public enum TelemetryEventType {
    TAB_BLUR,               // Candidate switched away from the browser tab
    TAB_FOCUS,              // Candidate returned to the interview tab
    PASTE_DUMP,             // Instantaneous multi-line paste event detected
    KEYSTROKE_BURST,        // Unnatural typing cadence (>25 chars/sec)
    IDLE_TIMEOUT,           // Candidate was inactive for extended duration
    COPY_ATTEMPT            // Candidate attempted to copy question text
}
