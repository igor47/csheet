-- migrate:up
CREATE TABLE chat_messages (
  id CHARACTER VARYING(26) PRIMARY KEY,
  character_id CHARACTER VARYING(26) NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  tool_calls JSONB,
  tool_results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_chat_messages_character_created
  ON chat_messages(character_id, created_at DESC);

-- migrate:down
DROP TABLE IF EXISTS chat_messages;

