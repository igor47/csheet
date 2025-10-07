-- migrate:up
CREATE TABLE char_spells_learned (
  id TEXT PRIMARY KEY CHECK(length(id) = 26),
  character_id TEXT NOT NULL,
  spell_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('learn', 'forget')),
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_spells_learned_char_id ON char_spells_learned(character_id);
CREATE INDEX idx_char_spells_learned_spell_id ON char_spells_learned(spell_id);

CREATE TRIGGER char_spells_learned_updated_at
AFTER UPDATE ON char_spells_learned
FOR EACH ROW
BEGIN
    UPDATE char_spells_learned SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- migrate:down
DROP TRIGGER IF EXISTS char_spells_learned_updated_at;
DROP INDEX IF EXISTS idx_char_spells_learned_spell_id;
DROP INDEX IF EXISTS idx_char_spells_learned_char_id;
DROP TABLE IF EXISTS char_spells_learned;
