-- V4: Add behavioral and system design dimension columns to progress_ledger
ALTER TABLE progress_ledger ADD COLUMN IF NOT EXISTS leadership_score INT;
ALTER TABLE progress_ledger ADD COLUMN IF NOT EXISTS conflict_resolution_score INT;
ALTER TABLE progress_ledger ADD COLUMN IF NOT EXISTS teamwork_score INT;
ALTER TABLE progress_ledger ADD COLUMN IF NOT EXISTS adaptability_score INT;
ALTER TABLE progress_ledger ADD COLUMN IF NOT EXISTS communication_behavioral_score INT;
