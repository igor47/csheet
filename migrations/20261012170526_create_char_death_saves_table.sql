-- migrate:up
-- What happens to a character at 0 HP, as a log of events. While there are rows since the
-- last `up`, the character is down: at 0 HP whatever their HP maximum does since, and dying,
-- stable or dead as replayed from those rows. Only regaining HP (or being restored to life)
-- writes `up`, which ends it and resets the death saves.
--   down    - dropped to 0 HP, starting a fresh set of death saves
--   success - death save successes (amount 1), from a roll of 10+ (a 20 also regains 1 HP)
--   failure - death save failures (amount 1 or 2), from a roll under 10 or damage taken at 0 HP
--   stable  - stabilized by someone else (e.g. a Medicine check or Spare the Dying)
--   dead    - died: a third failure, or massive damage
--   up      - regained HP, so no longer down
CREATE TABLE char_death_saves (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('down', 'success', 'failure', 'stable', 'dead', 'up')),
  amount INTEGER NOT NULL DEFAULT 1 CHECK (amount BETWEEN 0 AND 2),
  roll INTEGER CHECK (roll BETWEEN 1 AND 20),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_death_saves_char_id_id ON char_death_saves(character_id, id);

CREATE TRIGGER char_death_saves_updated_at
  BEFORE UPDATE ON char_death_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_death_saves_updated_at ON char_death_saves;
DROP INDEX IF EXISTS idx_char_death_saves_char_id_id;
DROP TABLE IF EXISTS char_death_saves;
