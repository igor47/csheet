-- migrate:up
ALTER TABLE char_rests
ADD COLUMN wild_shape_uses_restored INTEGER NOT NULL DEFAULT 0;

-- migrate:down
ALTER TABLE char_rests
DROP COLUMN wild_shape_uses_restored;
