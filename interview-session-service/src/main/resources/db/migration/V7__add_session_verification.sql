-- V7: Add session verification table for mandatory hardware and screen share gate
CREATE TABLE IF NOT EXISTS session_verifications (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL UNIQUE REFERENCES interview_sessions(id) ON DELETE CASCADE,
    camera_status VARCHAR(50) NOT NULL,
    mic_status VARCHAR(50) NOT NULL,
    screen_status VARCHAR(50) NOT NULL,
    screen_scope VARCHAR(50) NOT NULL,
    screen_label VARCHAR(255),
    consent BOOLEAN NOT NULL,
    outcome VARCHAR(50) NOT NULL,
    user_agent VARCHAR(500),
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_verification_session ON session_verifications(session_id);
