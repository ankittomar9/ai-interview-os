-- V6: Add plan_json column to interview_sessions table (C1)
ALTER TABLE interview_sessions ADD COLUMN IF NOT EXISTS plan_json TEXT;
