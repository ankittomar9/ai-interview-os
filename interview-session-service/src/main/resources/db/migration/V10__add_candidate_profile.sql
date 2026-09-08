-- V10: Add candidate_profile table for Phase P4 proctored flow & persistent candidate context
CREATE TABLE IF NOT EXISTS candidate_profile (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL DEFAULT 'local' UNIQUE,
    full_name TEXT,
    target_role TEXT,
    target_company TEXT,
    job_description TEXT,
    resume_text TEXT,
    resume_pdf_path TEXT,
    persona TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_candidate_profile_user_id ON candidate_profile(user_id);
