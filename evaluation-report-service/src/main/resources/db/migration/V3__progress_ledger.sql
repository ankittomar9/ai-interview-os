-- V3: Add Progress Ledger table for historical candidate trajectory tracking
CREATE TABLE IF NOT EXISTS progress_ledger (
    id BIGSERIAL PRIMARY KEY,
    candidate_id VARCHAR(255) NOT NULL,
    track VARCHAR(50) NOT NULL,
    session_id BIGINT NOT NULL,
    session_date DATE NOT NULL,
    rubric_schema VARCHAR(50) NOT NULL,
    overall_score INT NOT NULL,
    dimension_scores TEXT,
    algorithmic_reasoning_score INT,
    code_quality_score INT,
    execution_efficiency_score INT,
    communication_score INT,
    professionalism_score INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_progress_candidate ON progress_ledger(candidate_id);
CREATE INDEX IF NOT EXISTS idx_progress_candidate_track ON progress_ledger(candidate_id, track);
CREATE INDEX IF NOT EXISTS idx_progress_session_date ON progress_ledger(candidate_id, session_date);
