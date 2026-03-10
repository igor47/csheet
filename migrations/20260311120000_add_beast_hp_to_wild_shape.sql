-- migrate:up
ALTER TABLE char_wild_shape_uses
ADD COLUMN beast_hp INTEGER;

-- migrate:down
ALTER TABLE char_wild_shape_uses
DROP COLUMN beast_hp;
