-- migrate:up

-- Campaigns table
CREATE TABLE campaigns (
  id VARCHAR(26) PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_by VARCHAR(26) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_campaigns_created_by ON campaigns(created_by);

CREATE TRIGGER campaigns_updated_at
    BEFORE UPDATE ON campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Campaign members (DMs, players, viewers)
CREATE TABLE campaign_members (
  id VARCHAR(26) PRIMARY KEY,
  campaign_id VARCHAR(26) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id VARCHAR(26) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('dm', 'player', 'viewer')),
  invited_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  invited_by VARCHAR(26) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT campaign_members_unique UNIQUE(campaign_id, user_id),
  CONSTRAINT campaign_members_not_both_accepted_and_declined CHECK (NOT (accepted_at IS NOT NULL AND declined_at IS NOT NULL))
);

CREATE INDEX idx_campaign_members_campaign_id ON campaign_members(campaign_id);
CREATE INDEX idx_campaign_members_user_id ON campaign_members(user_id);

CREATE TRIGGER campaign_members_updated_at
    BEFORE UPDATE ON campaign_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Campaign characters (characters added to campaigns)
CREATE TABLE campaign_characters (
  id VARCHAR(26) PRIMARY KEY,
  campaign_id VARCHAR(26) NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  character_id VARCHAR(26) NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  revealed_at TIMESTAMPTZ,
  added_by VARCHAR(26) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT campaign_characters_unique UNIQUE(campaign_id, character_id)
);

CREATE INDEX idx_campaign_characters_campaign_id ON campaign_characters(campaign_id);
CREATE INDEX idx_campaign_characters_character_id ON campaign_characters(character_id);

CREATE TRIGGER campaign_characters_updated_at
    BEFORE UPDATE ON campaign_characters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down

DROP TRIGGER IF EXISTS campaign_characters_updated_at ON campaign_characters;
DROP INDEX IF EXISTS idx_campaign_characters_character_id;
DROP INDEX IF EXISTS idx_campaign_characters_campaign_id;
DROP TABLE IF EXISTS campaign_characters;

DROP TRIGGER IF EXISTS campaign_members_updated_at ON campaign_members;
DROP INDEX IF EXISTS idx_campaign_members_user_id;
DROP INDEX IF EXISTS idx_campaign_members_campaign_id;
DROP TABLE IF EXISTS campaign_members;

DROP TRIGGER IF EXISTS campaigns_updated_at ON campaigns;
DROP INDEX IF EXISTS idx_campaigns_created_by;
DROP TABLE IF EXISTS campaigns;

