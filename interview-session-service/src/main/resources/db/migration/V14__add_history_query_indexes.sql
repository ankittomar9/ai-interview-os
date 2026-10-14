-- SPEC-017: history calendar / day aggregation read paths
CREATE INDEX IF NOT EXISTS idx_practice_attempts_user_created_at
    ON practice_attempts(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_session_questions_session_id
    ON session_questions(session_id);
