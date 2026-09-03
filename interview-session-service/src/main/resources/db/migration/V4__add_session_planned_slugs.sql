-- V4: Add session_planned_slugs table for multi-problem interview sequences
CREATE TABLE IF NOT EXISTS session_planned_slugs (
    session_id BIGINT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    slug VARCHAR(255) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_planned_slugs_session ON session_planned_slugs(session_id);
