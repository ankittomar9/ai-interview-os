-- V1: Initial Schema for Proctor Sentinel Service
CREATE TABLE IF NOT EXISTS telemetry_events (
    id BIGSERIAL PRIMARY KEY,
    session_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    character_count INTEGER,
    duration_seconds BIGINT,
    metadata_details TEXT,
    is_flagged BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_telemetry_session ON telemetry_events(session_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_flagged ON telemetry_events(is_flagged);
