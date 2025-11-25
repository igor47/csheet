-- migrate:up
-- Add archived_at column for soft-delete archiving of campaigns
ALTER TABLE campaigns ADD COLUMN archived_at TIMESTAMPTZ DEFAULT NULL;
CREATE INDEX idx_campaigns_created_by_archived_at ON campaigns(created_by, archived_at);

-- migrate:down
DROP INDEX IF EXISTS idx_campaigns_created_by_archived_at;
ALTER TABLE campaigns DROP COLUMN archived_at;
