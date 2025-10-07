-- migrate:up
CREATE TABLE char_spells_prepared (
  id TEXT PRIMARY KEY CHECK(length(id) = 26),
  character_id TEXT NOT NULL,
  spell_id TEXT NOT NULL,
  prepared_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_spells_prepared_char_id_prepared_at ON char_spells_prepared(character_id, prepared_at);
CREATE INDEX idx_char_spells_prepared_spell_id ON char_spells_prepared(spell_id);

CREATE TRIGGER char_spells_prepared_updated_at
AFTER UPDATE ON char_spells_prepared
FOR EACH ROW
BEGIN
    UPDATE char_spells_prepared SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- migrate:down
DROP TRIGGER IF EXISTS char_spells_prepared_updated_at;
DROP INDEX IF EXISTS idx_char_spells_prepared_spell_id;
DROP INDEX IF EXISTS idx_char_spells_prepared_char_id_prepared_at;
DROP TABLE IF EXISTS char_spells_prepared;
