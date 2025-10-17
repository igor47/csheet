-- migrate:up
CREATE TABLE char_abilities (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  ability TEXT NOT NULL CHECK(ability IN ('strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma')),
  score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 30),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_abilities_char_id_ability_created_at ON char_abilities(character_id, ability, created_at);

CREATE TRIGGER char_abilities_updated_at
    BEFORE UPDATE ON char_abilities
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_abilities_updated_at ON char_abilities;
DROP INDEX IF EXISTS idx_char_abilities_char_id_ability_created_at;
DROP TABLE IF EXISTS char_abilities;
