-- migrate:up

ALTER TABLE characters
ADD COLUMN avatar_id TEXT REFERENCES uploads(id);

-- migrate:down

ALTER TABLE characters
DROP COLUMN avatar_id;

