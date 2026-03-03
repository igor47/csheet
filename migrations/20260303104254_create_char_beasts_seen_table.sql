-- migrate:up
-- Druid Wild Shape: beasts the character has seen and can transform into
CREATE TABLE char_beasts_seen (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  beast_id TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  UNIQUE (character_id, beast_id)
);

CREATE INDEX idx_char_beasts_seen_char_id ON char_beasts_seen(character_id);
CREATE INDEX idx_char_beasts_seen_beast_id ON char_beasts_seen(beast_id);

CREATE TRIGGER char_beasts_seen_updated_at
    BEFORE UPDATE ON char_beasts_seen
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_beasts_seen_updated_at ON char_beasts_seen;
DROP INDEX IF EXISTS idx_char_beasts_seen_beast_id;
DROP INDEX IF EXISTS idx_char_beasts_seen_char_id;
DROP TABLE IF EXISTS char_beasts_seen;
