-- V5: Add Integrity Summary Columns (A13)
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS echo_filtered_count INTEGER DEFAULT 0;
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS dropped_chunks INTEGER DEFAULT 0;
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS consent_downgrades INTEGER DEFAULT 0;
ALTER TABLE evaluation_reports ADD COLUMN IF NOT EXISTS workspace_provenance VARCHAR(100) DEFAULT 'LOCAL_SANDBOX';
