-- migrate:up
CREATE TABLE char_spell_slots (
  id TEXT PRIMARY KEY CHECK(length(id) = 26),
  character_id TEXT NOT NULL,
  slot_level INTEGER NOT NULL CHECK(slot_level BETWEEN 1 AND 9),
  action TEXT NOT NULL CHECK(action IN ('use', 'restore')),
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_spell_slots_char_id_slot_level_created_at ON char_spell_slots(character_id, slot_level, created_at);

CREATE TRIGGER char_spell_slots_updated_at
AFTER UPDATE ON char_spell_slots
FOR EACH ROW
BEGIN
    UPDATE char_spell_slots SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- migrate:down
DROP TRIGGER IF EXISTS char_spell_slots_updated_at;
DROP INDEX IF EXISTS idx_char_spell_slots_char_id_slot_level_created_at;
DROP TABLE IF EXISTS char_spell_slots;
