-- migrate:up
ALTER TABLE char_abilities ADD COLUMN proficiency INTEGER NOT NULL DEFAULT 0 CHECK(proficiency IN (0, 1));

-- migrate:down
ALTER TABLE char_abilities DROP COLUMN proficiency;
