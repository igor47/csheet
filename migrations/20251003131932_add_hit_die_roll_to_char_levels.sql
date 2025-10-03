-- migrate:up
ALTER TABLE char_levels ADD COLUMN hit_die_roll INTEGER NOT NULL DEFAULT 1 CHECK(hit_die_roll BETWEEN 1 AND 12);

-- migrate:down
ALTER TABLE char_levels DROP COLUMN hit_die_roll;
