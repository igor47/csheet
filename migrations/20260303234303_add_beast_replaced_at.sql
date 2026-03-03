-- migrate:up
-- Add soft delete columns for beast prep history tracking
ALTER TABLE char_beasts_seen
ADD COLUMN replaced_at TIMESTAMPTZ;

ALTER TABLE char_beasts_seen
ADD COLUMN replaced_by TEXT;

-- Remove unique constraint to allow re-learning same beast after replacement
ALTER TABLE char_beasts_seen
DROP CONSTRAINT char_beasts_seen_character_id_beast_id_key;

-- Index for efficient "current beasts" query (WHERE replaced_at IS NULL)
CREATE INDEX idx_char_beasts_seen_current
ON char_beasts_seen (character_id)
WHERE replaced_at IS NULL;

-- migrate:down
DROP INDEX IF EXISTS idx_char_beasts_seen_current;

ALTER TABLE char_beasts_seen
DROP COLUMN replaced_by;

ALTER TABLE char_beasts_seen
DROP COLUMN replaced_at;

-- Re-add unique constraint (note: this may fail if duplicate entries exist)
ALTER TABLE char_beasts_seen
ADD CONSTRAINT char_beasts_seen_character_id_beast_id_key UNIQUE (character_id, beast_id);
