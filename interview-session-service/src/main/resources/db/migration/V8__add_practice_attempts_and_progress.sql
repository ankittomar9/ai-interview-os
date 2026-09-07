-- V8: Add practice attempts and question progress tables for persistent tracking
CREATE TABLE IF NOT EXISTS practice_attempts (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'local',
    question_id TEXT NOT NULL,
    track TEXT NOT NULL,
    language_id INT NOT NULL,
    verdict TEXT NOT NULL,
    tests_passed INT NOT NULL,
    tests_total INT NOT NULL,
    runtime_ms INT,
    memory_kb INT,
    attempt_seq INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attempts_question ON practice_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user_question ON practice_attempts(user_id, question_id);

CREATE TABLE IF NOT EXISTS question_progress (
    user_id TEXT NOT NULL DEFAULT 'local',
    question_id TEXT NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    solve_count INT NOT NULL DEFAULT 0,
    first_solved_at TIMESTAMP WITH TIME ZONE,
    last_attempted_at TIMESTAMP WITH TIME ZONE,
    PRIMARY KEY (user_id, question_id)
);
