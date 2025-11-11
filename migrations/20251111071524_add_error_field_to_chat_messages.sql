-- migrate:up
ALTER TABLE chat_messages
  ADD COLUMN error JSONB;

-- migrate:down
ALTER TABLE chat_messages
  DROP COLUMN error;
