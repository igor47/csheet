-- migrate:up
ALTER TABLE item_damage ADD COLUMN flat_bonus INTEGER DEFAULT NULL;

-- migrate:down
ALTER TABLE item_damage DROP COLUMN flat_bonus;
