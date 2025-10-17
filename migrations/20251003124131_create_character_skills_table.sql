-- migrate:up
CREATE TABLE char_skills (
  id VARCHAR(26) PRIMARY KEY,
  character_id VARCHAR(26) NOT NULL,
  skill TEXT NOT NULL CHECK(skill IN ('acrobatics','animal handling','arcana','athletics','deception','history','insight','intimidation','investigation','medicine','nature','perception','performance','persuasion','religion','sleight of hand','stealth','survival')),
  proficiency TEXT NOT NULL DEFAULT 'none' CHECK(proficiency IN ('none', 'half', 'proficient', 'expert')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (character_id) REFERENCES characters(id) ON DELETE CASCADE
);

CREATE INDEX idx_char_skills_char_id_skill_created_at ON char_skills(character_id, skill, created_at);

CREATE TRIGGER char_skills_updated_at
    BEFORE UPDATE ON char_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- migrate:down
DROP TRIGGER IF EXISTS char_skills_updated_at ON char_skills;
DROP INDEX IF EXISTS idx_char_skills_char_id_skill_created_at;
DROP TABLE IF EXISTS char_skills;
