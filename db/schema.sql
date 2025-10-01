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
CREATE TABLE char_levels (
  id TEXT PRIMARY KEY CHECK(length(id) = 26),
  character_id TEXT NOT NULL,
  class TEXT NOT NULL,            -- "Fighter", "Wizard", etc.
  level INTEGER NOT NULL CHECK(level BETWEEN 1 AND 20),
  subclass TEXT,                  -- e.g., "Evocation"
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
CREATE INDEX idx_char_levels_char_id_created_at ON char_levels(character_id, created_at);
CREATE TRIGGER char_levels_updated_at
AFTER UPDATE ON char_levels
FOR EACH ROW
BEGIN
    UPDATE char_levels SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('20250924190507'),
  ('20250929165649'),
  ('20251001204923');
