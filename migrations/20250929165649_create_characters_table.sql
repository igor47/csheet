-- migrate:up
CREATE TABLE characters (
    id VARCHAR(26) PRIMARY KEY,
    user_id VARCHAR(26) NOT NULL,
    name TEXT NOT NULL,
    race TEXT NOT NULL,
    subrace TEXT,
    background TEXT NOT NULL,
    alignment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_characters_user_id ON characters(user_id);

CREATE TRIGGER characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS characters_updated_at ON characters;
DROP INDEX IF EXISTS idx_characters_user_id;
DROP TABLE IF EXISTS characters;
