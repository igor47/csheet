-- migrate:up
CREATE TABLE item_damage (
  id VARCHAR(26) PRIMARY KEY,
  item_id VARCHAR(26) NOT NULL,
  dice INTEGER[] NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('slashing','piercing','bludgeoning','fire','cold','lightning','thunder','acid','radiant','necrotic','force','poison','psychic')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX idx_item_damage_item_id ON item_damage(item_id);

-- migrate:down
DROP INDEX IF EXISTS idx_item_damage_item_id;
DROP TABLE IF EXISTS item_damage;
