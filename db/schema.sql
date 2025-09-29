CREATE TABLE IF NOT EXISTS "schema_migrations" (version varchar(128) primary key);
CREATE TABLE users (
    id TEXT PRIMARY KEY CHECK(length(id) = 26),
    email TEXT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE TRIGGER users_updated_at
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TABLE characters (
    id TEXT PRIMARY KEY CHECK(length(id) = 26),
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    race TEXT NOT NULL,
    class TEXT NOT NULL,
    background TEXT NOT NULL,
    size TEXT NOT NULL,
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
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('20250924190507'),
  ('20250929165649');
