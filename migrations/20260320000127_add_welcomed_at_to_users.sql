-- migrate:up
ALTER TABLE users ADD COLUMN welcomed_at timestamp with time zone;
ALTER TABLE users ALTER COLUMN marketing_opt_in SET DEFAULT false;

-- migrate:down
ALTER TABLE users DROP COLUMN welcomed_at;
ALTER TABLE users ALTER COLUMN marketing_opt_in SET DEFAULT true;
