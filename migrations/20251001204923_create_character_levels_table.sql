-- migrate:up
CREATE TABLE char_levels (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  class TEXT NOT NULL,            -- "Fighter", "Wizard", etc.
  level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 20),
  subclass TEXT,                  -- e.g., "Evocation"
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_levels_char_id_created_at ON char_levels(character_id, created_at);

CREATE TRIGGER char_levels_updated_at
    BEFORE UPDATE ON char_levels
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_levels_updated_at ON char_levels;
DROP INDEX IF EXISTS idx_char_levels_char_id_created_at;
DROP TABLE IF EXISTS char_levels;
