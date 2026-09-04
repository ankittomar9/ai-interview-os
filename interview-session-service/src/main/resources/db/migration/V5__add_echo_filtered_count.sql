-- V5: Add echo_filtered_count column to session_messages table
ALTER TABLE session_messages ADD COLUMN IF NOT EXISTS echo_filtered_count INTEGER;
