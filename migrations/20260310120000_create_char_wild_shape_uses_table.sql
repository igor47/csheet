-- migrate:up
-- Druid Wild Shape: tracking of wild shape transformation uses
CREATE TABLE char_wild_shape_uses (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  beast_id TEXT NOT NULL,
  ended_at TIMESTAMPTZ,      -- NULL = ongoing transformation
  recovered_at TIMESTAMPTZ,  -- NULL = counts against available uses
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_wild_shape_uses_character
  ON char_wild_shape_uses(character_id, created_at DESC);

CREATE INDEX idx_char_wild_shape_uses_ongoing
  ON char_wild_shape_uses(character_id) WHERE ended_at IS NULL;

CREATE INDEX idx_char_wild_shape_uses_unrecovered
  ON char_wild_shape_uses(character_id) WHERE recovered_at IS NULL;

CREATE TRIGGER char_wild_shape_uses_updated_at
  BEFORE UPDATE ON char_wild_shape_uses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_wild_shape_uses_updated_at ON char_wild_shape_uses;
DROP INDEX IF EXISTS idx_char_wild_shape_uses_unrecovered;
DROP INDEX IF EXISTS idx_char_wild_shape_uses_ongoing;
DROP INDEX IF EXISTS idx_char_wild_shape_uses_character;
DROP TABLE IF EXISTS char_wild_shape_uses;
