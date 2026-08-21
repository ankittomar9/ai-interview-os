-- V2: Add Structured Qualitative Rubric Columns
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS rubric_json TEXT;
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS rubric_llm_generated BOOLEAN DEFAULT false;
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS requirements_clarification_score INTEGER;
