-- migrate:up
-- Records spent ALTCHA challenge salts so a solved proof-of-work cannot be
-- replayed. The salt (random + embedded expiry) is unique per challenge.
CREATE TABLE altcha_solutions (
    salt TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX idx_altcha_solutions_expires_at ON altcha_solutions (expires_at);

-- migrate:down
DROP INDEX IF EXISTS idx_altcha_solutions_expires_at;
DROP TABLE IF EXISTS altcha_solutions;
