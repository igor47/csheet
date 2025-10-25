-- migrate:up
CREATE TABLE item_charges (
  id VARCHAR(26) PRIMARY KEY,
  item_id VARCHAR(26) NOT NULL,
  delta INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE
);

CREATE INDEX idx_item_charges_item_id_created_at ON item_charges(item_id, created_at);

CREATE TRIGGER item_charges_updated_at
  BEFORE UPDATE ON item_charges
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS item_charges_updated_at ON item_charges;
DROP INDEX IF EXISTS idx_item_charges_item_id_created_at;
DROP TABLE IF EXISTS item_charges;
