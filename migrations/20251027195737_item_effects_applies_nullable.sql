-- migrate:up
ALTER TABLE item_effects
  ALTER COLUMN applies DROP NOT NULL;

ALTER TABLE item_effects
  DROP CONSTRAINT IF EXISTS item_effects_applies_check;

ALTER TABLE item_effects
  ADD CONSTRAINT item_effects_applies_check
  CHECK(applies IS NULL OR applies IN ('worn','wielded'));

-- migrate:down
ALTER TABLE item_effects
  DROP CONSTRAINT IF EXISTS item_effects_applies_check;

ALTER TABLE item_effects
  ADD CONSTRAINT item_effects_applies_check
  CHECK(applies IN ('worn','wielded'));

ALTER TABLE item_effects
  ALTER COLUMN applies SET NOT NULL;

