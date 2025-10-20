-- migrate:up
CREATE TABLE char_notes (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  is_backup BOOLEAN NOT NULL DEFAULT false,
  restored_from_id VARCHAR(26) REFERENCES char_notes(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_char_notes_character_id_created_at ON char_notes(character_id, created_at DESC);

CREATE TRIGGER update_char_notes_updated_at
  BEFORE UPDATE ON char_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TABLE char_notes;

