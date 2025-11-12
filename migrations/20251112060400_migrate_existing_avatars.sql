-- migrate:up
-- Migrate existing avatar_id from characters table to character_avatars table
-- Using md5 hash of character_id + timestamp to generate unique IDs (ULID-like)
INSERT INTO character_avatars (id, character_id, upload_id, is_primary, created_at, updated_at)
SELECT
  SUBSTRING(MD5(id || EXTRACT(EPOCH FROM CURRENT_TIMESTAMP)::TEXT) FROM 1 FOR 26) as id,
  id as character_id,
  avatar_id as upload_id,
  TRUE as is_primary,
  CURRENT_TIMESTAMP as created_at,
  CURRENT_TIMESTAMP as updated_at
FROM characters
WHERE avatar_id IS NOT NULL;

-- migrate:down
-- Remove migrated avatars
DELETE FROM character_avatars
WHERE character_id IN (
  SELECT id FROM characters WHERE avatar_id IS NOT NULL
);
