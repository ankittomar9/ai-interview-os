-- V12: Convert LOB columns to PostgreSQL TEXT (F3.3)
ALTER TABLE interview_sessions ALTER COLUMN job_description TYPE TEXT;
ALTER TABLE interview_sessions ALTER COLUMN plan_json TYPE TEXT;
ALTER TABLE session_messages ALTER COLUMN content TYPE TEXT;
ALTER TABLE session_messages ALTER COLUMN code_snippet TYPE TEXT;
