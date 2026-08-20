-- V1: Initial Schema for Evaluation Report Service
CREATE TABLE IF NOT EXISTS evaluation_reports (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL UNIQUE,
    candidate_id VARCHAR(255) NOT NULL,
    role_title VARCHAR(255),
    track VARCHAR(100),
    difficulty VARCHAR(50),
    verdict VARCHAR(50) NOT NULL,
    overall_score INTEGER NOT NULL,
    technical_accuracy_score INTEGER NOT NULL,
    problem_solving_score INTEGER NOT NULL,
    communication_clarity_score INTEGER NOT NULL,
    code_quality_score INTEGER NOT NULL,
    integrity_score INTEGER NOT NULL,
    executive_summary TEXT,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS report_strengths (
    report_id BIGINT NOT NULL REFERENCES evaluation_reports(id) ON DELETE CASCADE,
    key_strengths VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS report_weaknesses (
    report_id BIGINT NOT NULL REFERENCES evaluation_reports(id) ON DELETE CASCADE,
    areas_for_improvement VARCHAR(1000)
);

CREATE TABLE IF NOT EXISTS report_study_plan (
    report_id BIGINT NOT NULL REFERENCES evaluation_reports(id) ON DELETE CASCADE,
    seven_day_study_plan VARCHAR(1000)
);

CREATE INDEX IF NOT EXISTS idx_report_session ON evaluation_reports(session_id);
CREATE INDEX IF NOT EXISTS idx_report_candidate ON evaluation_reports(candidate_id);
