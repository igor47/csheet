-- migrate:up
CREATE TABLE char_items (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  item_id VARCHAR(26) NOT NULL,
  worn BOOLEAN DEFAULT false,
  wielded BOOLEAN DEFAULT false,
  dropped_at TIMESTAMPTZ,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_items_char_id_item_id_created_at ON char_items(character_id, item_id, created_at);
CREATE INDEX idx_char_items_item_id ON char_items(item_id);

CREATE TRIGGER char_items_updated_at
  BEFORE UPDATE ON char_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_items_updated_at ON char_items;
DROP INDEX IF EXISTS idx_char_items_item_id;
DROP INDEX IF EXISTS idx_char_items_char_id_item_id_created_at;
DROP TABLE IF EXISTS char_items;
