-- migrate:up
-- Wizard spellbook: purely additive (wizards never forget spells)
CREATE TABLE char_spells_learned (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  spell_id TEXT NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_spells_learned_char_id ON char_spells_learned(character_id);
CREATE INDEX idx_char_spells_learned_spell_id ON char_spells_learned(spell_id);

CREATE TRIGGER char_spells_learned_updated_at
    BEFORE UPDATE ON char_spells_learned
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_spells_learned_updated_at ON char_spells_learned;
DROP INDEX IF EXISTS idx_char_spells_learned_spell_id;
DROP INDEX IF EXISTS idx_char_spells_learned_char_id;
DROP TABLE IF EXISTS char_spells_learned;
