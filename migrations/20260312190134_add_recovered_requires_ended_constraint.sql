-- migrate:up
-- Enforce invariant: a wild shape use cannot be recovered while still ongoing.
-- recovered_at can only be set if ended_at is also set.
ALTER TABLE char_wild_shape_uses
ADD CONSTRAINT recovered_requires_ended
CHECK (recovered_at IS NULL OR ended_at IS NOT NULL);

-- migrate:down
ALTER TABLE char_wild_shape_uses
DROP CONSTRAINT recovered_requires_ended;
