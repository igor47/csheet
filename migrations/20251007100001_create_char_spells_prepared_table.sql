-- migrate:up
-- Prepared spells: event-sourced prepare/unprepare actions for all non-wizard casters
CREATE TABLE char_spells_prepared (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  class TEXT NOT NULL,
  spell_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('prepare', 'unprepare')),
  always_prepared BOOLEAN NOT NULL DEFAULT FALSE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_spells_prepared_char_id_class ON char_spells_prepared(character_id, class);
CREATE INDEX idx_char_spells_prepared_spell_id ON char_spells_prepared(spell_id);

CREATE TRIGGER char_spells_prepared_updated_at
    BEFORE UPDATE ON char_spells_prepared
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_spells_prepared_updated_at ON char_spells_prepared;
DROP INDEX IF EXISTS idx_char_spells_prepared_spell_id;
DROP INDEX IF EXISTS idx_char_spells_prepared_char_id_class;
DROP TABLE IF EXISTS char_spells_prepared;
