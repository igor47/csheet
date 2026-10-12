-- migrate:up
-- History tables are now read in id order rather than created_at order. created_at is
-- CURRENT_TIMESTAMP, the start of the transaction, so rows written in one transaction tied and
-- "latest row" lookups picked one at random; ulid ids are strictly increasing.
-- Rebuild the indexes for those lookups on id. Btree indexes scan either way, so no DESC.

DROP INDEX idx_char_abilities_char_id_ability_created_at;
CREATE INDEX idx_char_abilities_char_id_ability_id ON char_abilities(character_id, ability, id);

DROP INDEX idx_char_coins_char_id_created_at;
CREATE INDEX idx_char_coins_char_id_id ON char_coins(character_id, id);

-- no query reads hit dice or spell slots per die value or slot level
DROP INDEX idx_char_hit_dice_char_id_die_value_created_at;
CREATE INDEX idx_char_hit_dice_char_id_id ON char_hit_dice(character_id, id);

DROP INDEX idx_char_spell_slots_char_id_slot_level_created_at;
CREATE INDEX idx_char_spell_slots_char_id_id ON char_spell_slots(character_id, id);

DROP INDEX idx_char_hp_char_id_created_at;
CREATE INDEX idx_char_hp_char_id_id ON char_hp(character_id, id);

DROP INDEX idx_char_items_char_id_item_id_created_at;
CREATE INDEX idx_char_items_char_id_item_id_id ON char_items(character_id, item_id, id);

DROP INDEX idx_char_levels_char_id_created_at;
CREATE INDEX idx_char_levels_char_id_id ON char_levels(character_id, id);

DROP INDEX idx_char_notes_character_id_created_at;
CREATE INDEX idx_char_notes_char_id_id ON char_notes(character_id, id);

DROP INDEX idx_char_rests_character_id_created_at;
CREATE INDEX idx_char_rests_char_id_id ON char_rests(character_id, id);

DROP INDEX idx_char_skills_char_id_skill_created_at;
CREATE INDEX idx_char_skills_char_id_skill_id ON char_skills(character_id, skill, id);

DROP INDEX idx_char_traits_char_id;
CREATE INDEX idx_char_traits_char_id_id ON char_traits(character_id, id);

DROP INDEX idx_char_wild_shape_uses_character;
CREATE INDEX idx_char_wild_shape_uses_char_id_id ON char_wild_shape_uses(character_id, id);

DROP INDEX idx_item_charges_item_id_created_at;
CREATE INDEX idx_item_charges_item_id_id ON item_charges(item_id, id);

-- a chat's messages are looked up by chat_id alone, which the old index didn't lead with
DROP INDEX idx_chat_messages_chat_created;
CREATE INDEX idx_chat_messages_chat_id_id ON chat_messages(chat_id, id);

-- migrate:down

DROP INDEX idx_char_abilities_char_id_ability_id;
CREATE INDEX idx_char_abilities_char_id_ability_created_at ON char_abilities(character_id, ability, created_at);

DROP INDEX idx_char_coins_char_id_id;
CREATE INDEX idx_char_coins_char_id_created_at ON char_coins(character_id, created_at);

DROP INDEX idx_char_hit_dice_char_id_id;
CREATE INDEX idx_char_hit_dice_char_id_die_value_created_at ON char_hit_dice(character_id, die_value, created_at);

DROP INDEX idx_char_spell_slots_char_id_id;
CREATE INDEX idx_char_spell_slots_char_id_slot_level_created_at ON char_spell_slots(character_id, slot_level, created_at);

DROP INDEX idx_char_hp_char_id_id;
CREATE INDEX idx_char_hp_char_id_created_at ON char_hp(character_id, created_at);

DROP INDEX idx_char_items_char_id_item_id_id;
CREATE INDEX idx_char_items_char_id_item_id_created_at ON char_items(character_id, item_id, created_at);

DROP INDEX idx_char_levels_char_id_id;
CREATE INDEX idx_char_levels_char_id_created_at ON char_levels(character_id, created_at);

DROP INDEX idx_char_notes_char_id_id;
CREATE INDEX idx_char_notes_character_id_created_at ON char_notes(character_id, created_at DESC);

DROP INDEX idx_char_rests_char_id_id;
CREATE INDEX idx_char_rests_character_id_created_at ON char_rests(character_id, created_at DESC);

DROP INDEX idx_char_skills_char_id_skill_id;
CREATE INDEX idx_char_skills_char_id_skill_created_at ON char_skills(character_id, skill, created_at);

DROP INDEX idx_char_traits_char_id_id;
CREATE INDEX idx_char_traits_char_id ON char_traits(character_id, created_at);

DROP INDEX idx_char_wild_shape_uses_char_id_id;
CREATE INDEX idx_char_wild_shape_uses_character ON char_wild_shape_uses(character_id, created_at DESC);

DROP INDEX idx_item_charges_item_id_id;
CREATE INDEX idx_item_charges_item_id_created_at ON item_charges(item_id, created_at);

DROP INDEX idx_chat_messages_chat_id_id;
CREATE INDEX idx_chat_messages_chat_created ON chat_messages(character_id, chat_id, created_at DESC);
