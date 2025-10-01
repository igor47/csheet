-- migrate:up
CREATE TABLE char_levels (
  id TEXT PRIMARY KEY CHECK(length(id) = 26),
  character_id TEXT NOT NULL,
  class TEXT NOT NULL,            -- "Fighter", "Wizard", etc.
  level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 20),
  subclass TEXT,                  -- e.g., "Evocation"
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_levels_char_id_created_at ON char_levels(character_id, created_at);

CREATE TRIGGER char_levels_updated_at
AFTER UPDATE ON char_levels
FOR EACH ROW
BEGIN
    UPDATE char_levels SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- migrate:down
DROP TRIGGER IF EXISTS char_levels_updated_at;
DROP INDEX IF EXISTS idx_char_levels_char_id_created_at;
DROP TABLE IF EXISTS char_levels;
