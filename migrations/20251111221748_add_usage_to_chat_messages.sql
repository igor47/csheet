-- migrate:up
ALTER TABLE chat_messages ADD COLUMN usage jsonb;

-- migrate:down
ALTER TABLE chat_messages DROP COLUMN usage;

