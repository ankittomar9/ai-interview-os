-- V1: Initial Schema for Interview Session Service
CREATE TABLE IF NOT EXISTS interview_sessions (
    id BIGSERIAL PRIMARY KEY,
    candidate_id VARCHAR(255) NOT NULL,
    role_title VARCHAR(255) NOT NULL,
    track VARCHAR(100) NOT NULL,
    difficulty VARCHAR(50) NOT NULL,
    target_company VARCHAR(255),
    job_description TEXT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_seconds BIGINT
);

CREATE TABLE IF NOT EXISTS session_messages (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    sender_role VARCHAR(50) NOT NULL,
    message_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    code_snippet TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_candidate ON interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_messages_session ON session_messages(session_id);
