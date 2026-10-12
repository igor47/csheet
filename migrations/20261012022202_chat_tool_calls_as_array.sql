-- migrate:up
-- Store tool calls as an ordered array instead of an object keyed by tool call id.
-- jsonb sorts object keys, so the order the model made the calls in was lost.
-- The original order of existing rows can't be recovered; they keep jsonb's key order.

UPDATE chat_messages
SET tool_calls = (
  SELECT jsonb_agg(jsonb_build_object('id', e.key) || e.value ORDER BY e.ordinality)
  FROM jsonb_each(tool_calls) WITH ORDINALITY AS e(key, value, ordinality)
)
WHERE tool_calls IS NOT NULL
  AND jsonb_typeof(tool_calls) = 'object';

-- migrate:down

UPDATE chat_messages
SET tool_calls = (
  SELECT jsonb_object_agg(c->>'id', c - 'id')
  FROM jsonb_array_elements(tool_calls) AS c
)
WHERE tool_calls IS NOT NULL
  AND jsonb_typeof(tool_calls) = 'array';
