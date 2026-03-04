-- migrate:up
CREATE TABLE char_rests (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  rest_type TEXT NOT NULL CHECK(rest_type IN ('short', 'long')),
  hp_restored INTEGER NOT NULL DEFAULT 0,
  hit_dice_spent INTEGER NOT NULL DEFAULT 0,
  hit_dice_restored INTEGER NOT NULL DEFAULT 0,
  spell_slots_restored INTEGER NOT NULL DEFAULT 0,
  details JSONB,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_rests_character_id_created_at ON char_rests(character_id, created_at DESC);

CREATE TRIGGER char_rests_updated_at
    BEFORE UPDATE ON char_rests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_rests_updated_at ON char_rests;
DROP INDEX IF EXISTS idx_char_rests_character_id_created_at;
DROP TABLE IF EXISTS char_rests;
