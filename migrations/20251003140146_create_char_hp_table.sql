-- migrate:up
CREATE TABLE char_hp (
  id TEXT PRIMARY KEY CHECK(length(id) = 26),
  character_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_hp_char_id_created_at ON char_hp(character_id, created_at);

CREATE TRIGGER char_hp_updated_at
AFTER UPDATE ON char_hp
FOR EACH ROW
BEGIN
    UPDATE char_hp SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- migrate:down
DROP TRIGGER IF EXISTS char_hp_updated_at;
DROP INDEX IF EXISTS idx_char_hp_char_id_created_at;
DROP TABLE IF EXISTS char_hp;
