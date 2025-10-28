-- migrate:up

-- Add weapon property columns
ALTER TABLE items ADD COLUMN light boolean DEFAULT false;
ALTER TABLE items ADD COLUMN heavy boolean DEFAULT false;
ALTER TABLE items ADD COLUMN two_handed boolean DEFAULT false;
ALTER TABLE items ADD COLUMN reach boolean DEFAULT false;
ALTER TABLE items ADD COLUMN loading boolean DEFAULT false;

-- Add armor property column
ALTER TABLE items ADD COLUMN min_strength integer;

-- Add versatile flag to item_damage
ALTER TABLE item_damage ADD COLUMN versatile boolean DEFAULT false;

-- migrate:down

-- Remove columns from items table
ALTER TABLE items DROP COLUMN light;
ALTER TABLE items DROP COLUMN heavy;
ALTER TABLE items DROP COLUMN two_handed;
ALTER TABLE items DROP COLUMN reach;
ALTER TABLE items DROP COLUMN loading;
ALTER TABLE items DROP COLUMN min_strength;

-- Remove versatile from item_damage
ALTER TABLE item_damage DROP COLUMN versatile;

