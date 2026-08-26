-- V3: Add integrity signals and anti-cheat columns to session_messages table
ALTER TABLE session_messages ADD COLUMN IF NOT EXISTS keystroke_count INTEGER;
ALTER TABLE session_messages ADD COLUMN IF NOT EXISTS avg_keystroke_interval_ms INTEGER;
ALTER TABLE session_messages ADD COLUMN IF NOT EXISTS keystroke_variance INTEGER;
ALTER TABLE session_messages ADD COLUMN IF NOT EXISTS estimated_wpm INTEGER;
ALTER TABLE session_messages ADD COLUMN IF NOT EXISTS suspicious_typing BOOLEAN;
ALTER TABLE session_messages ADD COLUMN IF NOT EXISTS copy_count INTEGER;
ALTER TABLE session_messages ADD COLUMN IF NOT EXISTS paste_count INTEGER;
ALTER TABLE session_messages ADD COLUMN IF NOT EXISTS tab_switch_count INTEGER;
