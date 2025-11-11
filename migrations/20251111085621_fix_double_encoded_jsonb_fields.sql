-- migrate:up
-- Fix double-encoded JSONB fields in chat_messages
-- Converts string-encoded JSON back to proper JSONB objects

UPDATE chat_messages
SET tool_calls = (tool_calls#>>'{}')::jsonb
WHERE tool_calls IS NOT NULL
  AND jsonb_typeof(tool_calls) = 'string';

UPDATE chat_messages
SET tool_results = (tool_results#>>'{}')::jsonb
WHERE tool_results IS NOT NULL
  AND jsonb_typeof(tool_results) = 'string';

UPDATE chat_messages
SET error = (error#>>'{}')::jsonb
WHERE error IS NOT NULL
  AND jsonb_typeof(error) = 'string';

-- migrate:down
-- No down migration - this is a data fix
