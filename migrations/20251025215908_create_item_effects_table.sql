-- migrate:up
CREATE TABLE item_effects (
  id VARCHAR(26) PRIMARY KEY,
  item_id VARCHAR(26) NOT NULL,
  target TEXT NOT NULL,
  op TEXT NOT NULL CHECK(op IN ('add','set','advantage','disadvantage','proficiency','expertise')),
  value INTEGER,
  applies TEXT NOT NULL CHECK(applies IN ('worn','wielded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX idx_item_effects_item_id ON item_effects(item_id);

-- migrate:down
DROP INDEX IF EXISTS idx_item_effects_item_id;
DROP TABLE IF EXISTS item_effects;
