-- migrate:up
CREATE TABLE char_hit_dice (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  die_value INTEGER NOT NULL CHECK(die_value IN (6, 8, 10, 12)),
  action TEXT NOT NULL CHECK(action IN ('use', 'restore')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_hit_dice_char_id_die_value_created_at ON char_hit_dice(character_id, die_value, created_at);

CREATE TRIGGER char_hit_dice_updated_at
    BEFORE UPDATE ON char_hit_dice
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_hit_dice_updated_at ON char_hit_dice;
DROP INDEX IF EXISTS idx_char_hit_dice_char_id_die_value_created_at;
DROP TABLE IF EXISTS char_hit_dice;
