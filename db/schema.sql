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
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, hit_die_roll INTEGER NOT NULL DEFAULT 1 CHECK(hit_die_roll BETWEEN 1 AND 12),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
CREATE INDEX idx_char_levels_char_id_created_at ON char_levels(character_id, created_at);
CREATE TRIGGER char_levels_updated_at
AFTER UPDATE ON char_levels
FOR EACH ROW
BEGIN
    UPDATE char_levels SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TABLE char_abilities (
  id TEXT PRIMARY KEY CHECK(length(id) = 26),
  character_id TEXT NOT NULL,
  ability TEXT NOT NULL CHECK(ability IN ('strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma')),
  score INTEGER NOT NULL CHECK(score BETWEEN 1 AND 30),
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, proficiency INTEGER NOT NULL DEFAULT 0 CHECK(proficiency IN (0, 1)),
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
CREATE INDEX idx_char_abilities_char_id_ability_created_at ON char_abilities(character_id, ability, created_at);
CREATE TRIGGER char_abilities_updated_at
AFTER UPDATE ON char_abilities
FOR EACH ROW
BEGIN
    UPDATE char_abilities SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TABLE char_skills (
  id TEXT PRIMARY KEY CHECK(length(id) = 26),
  character_id TEXT NOT NULL,
  skill TEXT NOT NULL CHECK(skill IN ('acrobatics','animal handling','arcana','athletics','deception','history','insight','intimidation','investigation','medicine','nature','perception','performance','persuasion','religion','sleight of hand','stealth','survival')),
  proficiency TEXT NOT NULL DEFAULT 'none' CHECK(proficiency IN ('none', 'half', 'proficient', 'expert')),
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
CREATE INDEX idx_char_skills_char_id_skill_created_at ON char_skills(character_id, skill, created_at);
CREATE TRIGGER char_skills_updated_at
AFTER UPDATE ON char_skills
FOR EACH ROW
BEGIN
    UPDATE char_skills SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TABLE char_hp (
  id TEXT PRIMARY KEY CHECK(length(id) = 26),
  character_id TEXT NOT NULL,
  delta INTEGER NOT NULL,
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
CREATE INDEX idx_char_hp_char_id_created_at ON char_hp(character_id, created_at);
CREATE TRIGGER char_hp_updated_at
AFTER UPDATE ON char_hp
FOR EACH ROW
BEGIN
    UPDATE char_hp SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
CREATE TABLE char_hit_dice (
  id TEXT PRIMARY KEY CHECK(length(id) = 26),
  character_id TEXT NOT NULL,
  die_value INTEGER NOT NULL CHECK(die_value IN (6, 8, 10, 12)),
  action TEXT NOT NULL CHECK(action IN ('use', 'restore')),
  note TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);
CREATE INDEX idx_char_hit_dice_char_id_die_value_created_at ON char_hit_dice(character_id, die_value, created_at);
CREATE TRIGGER char_hit_dice_updated_at
AFTER UPDATE ON char_hit_dice
FOR EACH ROW
BEGIN
    UPDATE char_hit_dice SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;
-- Dbmate schema migrations
INSERT INTO "schema_migrations" (version) VALUES
  ('20250924190507'),
  ('20250929165649'),
  ('20251001204923'),
  ('20251002222515'),
  ('20251003120515'),
  ('20251003124131'),
  ('20251003131932'),
  ('20251003140146'),
  ('20251003140147');
