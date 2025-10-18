-- migrate:up
CREATE TABLE char_traits (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('species', 'lineage', 'background', 'class', 'subclass', 'custom')),
  source_detail TEXT,
  level INTEGER,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_traits_char_id ON char_traits(character_id, created_at);

CREATE TRIGGER char_traits_updated_at
    BEFORE UPDATE ON char_traits
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_traits_updated_at ON char_traits;
DROP INDEX IF EXISTS idx_char_traits_char_id;
DROP TABLE IF EXISTS char_traits;
