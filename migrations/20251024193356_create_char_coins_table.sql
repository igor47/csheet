-- migrate:up
CREATE TABLE char_coins (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  pp INTEGER NOT NULL DEFAULT 0 CHECK(pp >= 0),
  gp INTEGER NOT NULL DEFAULT 0 CHECK(gp >= 0),
  ep INTEGER NOT NULL DEFAULT 0 CHECK(ep >= 0),
  sp INTEGER NOT NULL DEFAULT 0 CHECK(sp >= 0),
  cp INTEGER NOT NULL DEFAULT 0 CHECK(cp >= 0),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_coins_char_id_created_at ON char_coins(character_id, created_at);

CREATE TRIGGER char_coins_updated_at
    BEFORE UPDATE ON char_coins
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_coins_updated_at ON char_coins;
DROP INDEX IF EXISTS idx_char_coins_char_id_created_at;
DROP TABLE IF EXISTS char_coins;

