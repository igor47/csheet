-- migrate:up
ALTER TABLE characters ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX idx_characters_user_id_archived_at ON characters(user_id, archived_at);

COMMENT ON COLUMN characters.archived_at IS 'Timestamp when the character was archived. NULL means the character is active.';

-- migrate:down
DROP INDEX IF EXISTS idx_characters_user_id_archived_at;
ALTER TABLE characters DROP COLUMN archived_at;
