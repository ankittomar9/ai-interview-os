-- V11: Add user_notes table for Phase P8 Learning Resource Center
CREATE TABLE IF NOT EXISTS user_notes (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR NOT NULL,
    question_slug VARCHAR NOT NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_notes_user_slug UNIQUE(user_id, question_slug)
);

CREATE INDEX IF NOT EXISTS idx_user_notes_question_slug ON user_notes(question_slug);
CREATE INDEX IF NOT EXISTS idx_user_notes_user_id ON user_notes(user_id);
