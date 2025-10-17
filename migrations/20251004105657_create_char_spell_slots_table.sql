-- migrate:up
CREATE TABLE char_spell_slots (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  slot_level INTEGER NOT NULL CHECK(slot_level BETWEEN 1 AND 9),
  action TEXT NOT NULL CHECK(action IN ('use', 'restore')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_spell_slots_char_id_slot_level_created_at ON char_spell_slots(character_id, slot_level, created_at);

CREATE TRIGGER char_spell_slots_updated_at
    BEFORE UPDATE ON char_spell_slots
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_spell_slots_updated_at ON char_spell_slots;
DROP INDEX IF EXISTS idx_char_spell_slots_char_id_slot_level_created_at;
DROP TABLE IF EXISTS char_spell_slots;
