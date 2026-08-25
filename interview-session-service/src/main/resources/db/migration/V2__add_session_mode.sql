-- V2: Add session_mode column to interview_sessions table
ALTER TABLE interview_sessions 
ADD COLUMN IF NOT EXISTS session_mode VARCHAR(50) NOT NULL DEFAULT 'INTERVIEW';
