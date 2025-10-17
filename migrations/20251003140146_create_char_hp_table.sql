-- migrate:up
CREATE TABLE char_hp (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  delta INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_hp_char_id_created_at ON char_hp(character_id, created_at);

CREATE TRIGGER char_hp_updated_at
    BEFORE UPDATE ON char_hp
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_hp_updated_at ON char_hp;
DROP INDEX IF EXISTS idx_char_hp_char_id_created_at;
DROP TABLE IF EXISTS char_hp;
