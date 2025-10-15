-- migrate:up
ALTER TABLE characters ADD COLUMN ruleset TEXT NOT NULL DEFAULT 'srd51';

-- migrate:down
ALTER TABLE characters DROP COLUMN IF EXISTS ruleset;
