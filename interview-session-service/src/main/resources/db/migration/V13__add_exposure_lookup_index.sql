-- V13: Covering index for candidate track exposure query (SPEC-016 §2.1)
CREATE INDEX IF NOT EXISTS idx_sessions_candidate_track ON interview_sessions(candidate_id, track);
