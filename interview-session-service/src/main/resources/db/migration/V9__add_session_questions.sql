-- V9: Add session_questions table for cross-mode question continuity (Addendum A)
CREATE TABLE IF NOT EXISTS session_questions (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
    question_slug TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    verdict TEXT NOT NULL DEFAULT 'UNATTEMPTED',
    attempted_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_session_questions_slug ON session_questions(question_slug);
CREATE INDEX IF NOT EXISTS idx_session_questions_session ON session_questions(session_id);
