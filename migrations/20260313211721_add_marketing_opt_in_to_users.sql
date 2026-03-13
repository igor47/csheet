-- migrate:up
ALTER TABLE users ADD COLUMN marketing_opt_in boolean NOT NULL DEFAULT true;

-- migrate:down
ALTER TABLE users DROP COLUMN marketing_opt_in;
