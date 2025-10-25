-- migrate:up
CREATE TABLE items (
  id VARCHAR(26) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK(category IN ('weapon','armor','shield','clothing','jewelry','potion','scroll','gear','tool','container','wand','misc')),

  -- Armor-specific fields
  armor_type TEXT CHECK(armor_type IN ('light','medium','heavy')),
  armor_class INTEGER CHECK(armor_class >= 0),
  armor_class_dex BOOLEAN DEFAULT false,
  armor_class_dex_max INTEGER CHECK(armor_class_dex_max >= 0),

  -- Shield-specific field
  armor_modifier INTEGER,

  -- Weapon-specific fields
  normal_range INTEGER CHECK(normal_range > 0),
  long_range INTEGER CHECK(long_range > 0),
  thrown BOOLEAN DEFAULT false,
  finesse BOOLEAN DEFAULT false,
  mastery TEXT CHECK(mastery IN ('cleave','graze','nick','push','sap','slow','topple','vex')),
  martial BOOLEAN DEFAULT false,

  created_by VARCHAR(26) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_items_created_by ON items(created_by);
CREATE INDEX idx_items_category ON items(category);

CREATE TRIGGER items_updated_at
  BEFORE UPDATE ON items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS items_updated_at ON items;
DROP INDEX IF EXISTS idx_items_category;
DROP INDEX IF EXISTS idx_items_created_by;
DROP TABLE IF EXISTS items;
