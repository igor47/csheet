-- migrate:up
CREATE TABLE auth_tokens (
    id VARCHAR(26) PRIMARY KEY,
    email TEXT NOT NULL,
    session_token_hash TEXT NOT NULL,
    otp_code_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ
);

-- Index for looking up tokens by email (for rate limiting)
CREATE INDEX idx_auth_tokens_email ON auth_tokens(email);

-- Index for looking up by session token hash (for magic link validation)
CREATE INDEX idx_auth_tokens_session_token_hash ON auth_tokens(session_token_hash);

-- Index for cleanup of expired tokens
CREATE INDEX idx_auth_tokens_expires_at ON auth_tokens(expires_at);

-- migrate:down
DROP INDEX IF EXISTS idx_auth_tokens_expires_at;
DROP INDEX IF EXISTS idx_auth_tokens_session_token_hash;
DROP INDEX IF EXISTS idx_auth_tokens_email;
DROP TABLE IF EXISTS auth_tokens;
