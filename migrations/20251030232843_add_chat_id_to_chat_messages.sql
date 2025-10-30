-- migrate:up
-- Add chat_id column (nullable initially for backward compatibility)
ALTER TABLE chat_messages ADD COLUMN chat_id VARCHAR(26);

-- Create index for efficient chat queries
CREATE INDEX idx_chat_messages_chat_created ON chat_messages(character_id, chat_id, created_at DESC);

-- Backfill existing messages: group all messages per character into a single chat
-- Use a simple UUID-based ID truncated to 26 chars (will be replaced by ULID on next insert from app)
WITH character_chats AS (
  SELECT DISTINCT
    character_id,
    SUBSTRING(REPLACE(gen_random_uuid()::TEXT, '-', '') FROM 1 FOR 26) as chat_id
  FROM chat_messages
  WHERE chat_id IS NULL
)
UPDATE chat_messages cm
SET chat_id = cc.chat_id
FROM character_chats cc
WHERE cm.character_id = cc.character_id
  AND cm.chat_id IS NULL;

-- Make chat_id required now that all existing rows have values
ALTER TABLE chat_messages ALTER COLUMN chat_id SET NOT NULL;

-- migrate:down
-- Remove chat_id column and index
DROP INDEX IF EXISTS idx_chat_messages_chat_created;
ALTER TABLE chat_messages DROP COLUMN chat_id;
