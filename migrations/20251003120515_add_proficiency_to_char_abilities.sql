-- migrate:up
ALTER TABLE char_abilities ADD COLUMN proficiency BOOLEAN NOT NULL DEFAULT FALSE;

-- migrate:down
ALTER TABLE char_abilities DROP COLUMN proficiency;
