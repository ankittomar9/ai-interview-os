package com.interviewos.proctor.model;

public enum TelemetryEventType {
    TAB_BLUR,               // Candidate switched away from the browser tab
    TAB_FOCUS,              // Candidate returned to the interview tab
    PASTE_DUMP,             // Instantaneous multi-line paste event detected
    KEYSTROKE_BURST,        // Unnatural typing cadence (>25 chars/sec)
    IDLE_TIMEOUT,           // Candidate was inactive for extended duration
    COPY_ATTEMPT,           // Candidate attempted to copy question text
    VERIFY_CAMERA_OK,           // Pre-interview camera hardware check passed
    VERIFY_MIC_OK,              // Pre-interview microphone hardware check passed
    VERIFY_SCREEN_OK,           // Full-monitor screen share acquired (scope in metadataDetails)
    VERIFY_SCREEN_REJECTED,     // Window/tab share attempted and rejected by policy
    SHARE_LOST,                 // Active monitor share ended unexpectedly mid-session
    SHARE_RESTORED,             // Monitor share re-acquired after SHARE_LOST
    SECONDARY_CAMERA_CONNECTED, // Phone companion camera connected and streaming
    SINGLE_CAMERA_ACKNOWLEDGED  // Candidate acknowledged proceeding with single front camera
}
