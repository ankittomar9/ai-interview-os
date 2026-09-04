-- V6: Add Plan-vs-Actual Breakdown Column (C4)
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS plan_vs_actual_json TEXT;
