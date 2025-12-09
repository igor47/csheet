-- migrate:up
ALTER TABLE users ADD COLUMN name TEXT;

-- migrate:down
ALTER TABLE users DROP COLUMN name;

