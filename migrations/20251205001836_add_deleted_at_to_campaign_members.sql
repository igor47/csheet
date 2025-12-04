-- migrate:up
ALTER TABLE campaign_members ADD COLUMN deleted_at timestamp;

-- migrate:down
ALTER TABLE campaign_members DROP COLUMN deleted_at;
