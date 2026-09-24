-- V-2.0.5 (V5-04 / RG-1 / RG-2): Add platform_degraded and degraded_annotation columns
-- to evaluation_reports and progress_ledger, and annotate Session #144 for re-grade.

ALTER TABLE evaluation_reports
    ADD COLUMN IF NOT EXISTS platform_degraded BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE evaluation_reports
    ADD COLUMN IF NOT EXISTS degraded_annotation TEXT;

ALTER TABLE progress_ledger
    ADD COLUMN IF NOT EXISTS platform_degraded BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE progress_ledger
    ADD COLUMN IF NOT EXISTS degraded_annotation TEXT;

UPDATE evaluation_reports
SET platform_degraded = TRUE,
    degraded_annotation = 'PLATFORM_DEGRADED (Gemini 503 during interview; deterministic fallback active — NEEDS_REGRADE)'
WHERE session_id = 144;

UPDATE progress_ledger
SET platform_degraded = TRUE,
    degraded_annotation = 'PLATFORM_DEGRADED (Gemini 503 during interview; deterministic fallback active)'
WHERE session_id = 144;
