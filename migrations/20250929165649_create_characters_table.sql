-- migrate:up
CREATE TABLE characters (
    id TEXT PRIMARY KEY CHECK(length(id) = 26),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    race TEXT NOT NULL,
    subrace TEXT,
    background TEXT NOT NULL,
    alignment TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_characters_user_id ON characters(user_id);

CREATE TRIGGER characters_updated_at
AFTER UPDATE ON characters
FOR EACH ROW
BEGIN
    UPDATE characters SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- migrate:down
DROP TRIGGER IF EXISTS characters_updated_at;
DROP INDEX IF EXISTS idx_characters_user_id;
DROP TABLE IF EXISTS characters;
