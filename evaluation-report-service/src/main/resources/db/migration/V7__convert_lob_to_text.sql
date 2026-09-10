-- V7: Convert LOB columns to PostgreSQL TEXT (F3.3)
ALTER TABLE evaluation_reports ALTER COLUMN executive_summary TYPE TEXT;
ALTER TABLE evaluation_reports ALTER COLUMN rubric_json TYPE TEXT;
ALTER TABLE evaluation_reports ALTER COLUMN plan_vs_actual_json TYPE TEXT;
ALTER TABLE progress_ledger ALTER COLUMN dimension_scores TYPE TEXT;
