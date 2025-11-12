-- migrate:up
CREATE TABLE character_avatars (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  upload_id TEXT NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  crop_x_percent REAL CHECK (crop_x_percent IS NULL OR (crop_x_percent >= 0 AND crop_x_percent <= 1)),
  crop_y_percent REAL CHECK (crop_y_percent IS NULL OR (crop_y_percent >= 0 AND crop_y_percent <= 1)),
  crop_width_percent REAL CHECK (crop_width_percent IS NULL OR (crop_width_percent >= 0 AND crop_width_percent <= 1)),
  crop_height_percent REAL CHECK (crop_height_percent IS NULL OR (crop_height_percent >= 0 AND crop_height_percent <= 1)),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(character_id, upload_id)
);

CREATE INDEX idx_character_avatars_character_id ON character_avatars(character_id);
CREATE INDEX idx_character_avatars_is_primary ON character_avatars(character_id, is_primary) WHERE is_primary = TRUE;

-- migrate:down
DROP INDEX IF EXISTS idx_character_avatars_is_primary;
DROP INDEX IF EXISTS idx_character_avatars_character_id;
DROP TABLE IF EXISTS character_avatars;
