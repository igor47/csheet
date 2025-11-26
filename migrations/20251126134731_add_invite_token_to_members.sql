-- migrate:up
ALTER TABLE campaign_members ADD COLUMN invite_token VARCHAR(26);
CREATE INDEX idx_campaign_members_invite_token ON campaign_members(invite_token);

-- migrate:down
DROP INDEX IF EXISTS idx_campaign_members_invite_token;
ALTER TABLE campaign_members DROP COLUMN invite_token;
