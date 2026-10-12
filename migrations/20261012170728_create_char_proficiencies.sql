-- migrate:up
-- Weapon, armor, tool, and language proficiencies, as a history of grants and removals, like
-- char_skills and char_traits. Species, background, and class grants are written at creation
-- and level-up (source species/lineage/background/class); feats, training, DM rulings, and the
-- choices the rules leave to the player are added by hand (source custom).
-- A character's current proficiencies are the (kind, name) pairs whose latest row is an 'add'.
-- Characters created before this table existed are filled in by utils/backfill-proficiencies.ts.
CREATE TABLE char_proficiencies (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('weapon', 'armor', 'tool', 'language')),
  name TEXT NOT NULL CHECK(name <> ''),
  action TEXT NOT NULL CHECK(action IN ('add', 'remove')),
  source TEXT NOT NULL CHECK(source IN ('species', 'lineage', 'background', 'class', 'custom')),
  source_detail TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_proficiencies_char_id_id ON char_proficiencies(character_id, id);

CREATE TRIGGER char_proficiencies_updated_at
    BEFORE UPDATE ON char_proficiencies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_proficiencies_updated_at ON char_proficiencies;
DROP INDEX IF EXISTS idx_char_proficiencies_char_id_id;
DROP TABLE IF EXISTS char_proficiencies;
