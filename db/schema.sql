\restrict ELRYEllzgERsiV4l7JhasXJTPmeatB0eNXTllLbpb7Zue2jrzquGINTlUxO5fUc

-- Dumped from database version 16.10
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.auth_tokens (
    id character varying(26) NOT NULL,
    email text NOT NULL,
    session_token_hash text NOT NULL,
    otp_code_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone
);


--
-- Name: char_abilities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.char_abilities (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    ability text NOT NULL,
    score integer NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    proficiency boolean DEFAULT false NOT NULL,
    CONSTRAINT char_abilities_ability_check CHECK ((ability = ANY (ARRAY['strength'::text, 'dexterity'::text, 'constitution'::text, 'intelligence'::text, 'wisdom'::text, 'charisma'::text]))),
    CONSTRAINT char_abilities_score_check CHECK (((score >= 1) AND (score <= 30)))
);


--
-- Name: char_coins; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.char_coins (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    pp integer DEFAULT 0 NOT NULL,
    gp integer DEFAULT 0 NOT NULL,
    ep integer DEFAULT 0 NOT NULL,
    sp integer DEFAULT 0 NOT NULL,
    cp integer DEFAULT 0 NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT char_coins_cp_check CHECK ((cp >= 0)),
    CONSTRAINT char_coins_ep_check CHECK ((ep >= 0)),
    CONSTRAINT char_coins_gp_check CHECK ((gp >= 0)),
    CONSTRAINT char_coins_pp_check CHECK ((pp >= 0)),
    CONSTRAINT char_coins_sp_check CHECK ((sp >= 0))
);


--
-- Name: char_hit_dice; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.char_hit_dice (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    die_value integer NOT NULL,
    action text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT char_hit_dice_action_check CHECK ((action = ANY (ARRAY['use'::text, 'restore'::text]))),
    CONSTRAINT char_hit_dice_die_value_check CHECK ((die_value = ANY (ARRAY[6, 8, 10, 12])))
);


--
-- Name: char_hp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.char_hp (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    delta integer NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: char_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.char_items (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    item_id character varying(26) NOT NULL,
    worn boolean DEFAULT false,
    wielded boolean DEFAULT false,
    dropped_at timestamp with time zone,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: char_levels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.char_levels (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    class text NOT NULL,
    level integer NOT NULL,
    subclass text,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    hit_die_roll integer DEFAULT 1 NOT NULL,
    CONSTRAINT char_levels_hit_die_roll_check CHECK (((hit_die_roll >= 1) AND (hit_die_roll <= 12))),
    CONSTRAINT char_levels_level_check CHECK (((level >= 1) AND (level <= 20)))
);


--
-- Name: char_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.char_notes (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    is_backup boolean DEFAULT false NOT NULL,
    restored_from_id character varying(26),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: char_skills; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.char_skills (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    skill text NOT NULL,
    proficiency text DEFAULT 'none'::text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT char_skills_proficiency_check CHECK ((proficiency = ANY (ARRAY['none'::text, 'half'::text, 'proficient'::text, 'expert'::text]))),
    CONSTRAINT char_skills_skill_check CHECK ((skill = ANY (ARRAY['acrobatics'::text, 'animal handling'::text, 'arcana'::text, 'athletics'::text, 'deception'::text, 'history'::text, 'insight'::text, 'intimidation'::text, 'investigation'::text, 'medicine'::text, 'nature'::text, 'perception'::text, 'performance'::text, 'persuasion'::text, 'religion'::text, 'sleight of hand'::text, 'stealth'::text, 'survival'::text])))
);


--
-- Name: char_spell_slots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.char_spell_slots (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    slot_level integer NOT NULL,
    action text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT char_spell_slots_action_check CHECK ((action = ANY (ARRAY['use'::text, 'restore'::text]))),
    CONSTRAINT char_spell_slots_slot_level_check CHECK (((slot_level >= 1) AND (slot_level <= 9)))
);


--
-- Name: char_spells_learned; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.char_spells_learned (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    spell_id text NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: char_spells_prepared; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.char_spells_prepared (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    class text NOT NULL,
    spell_id text NOT NULL,
    action text NOT NULL,
    always_prepared boolean DEFAULT false NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT char_spells_prepared_action_check CHECK ((action = ANY (ARRAY['prepare'::text, 'unprepare'::text])))
);


--
-- Name: char_traits; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.char_traits (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    source text NOT NULL,
    source_detail text,
    level integer,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT char_traits_source_check CHECK ((source = ANY (ARRAY['species'::text, 'lineage'::text, 'background'::text, 'class'::text, 'subclass'::text, 'custom'::text])))
);


--
-- Name: characters; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.characters (
    id character varying(26) NOT NULL,
    user_id character varying(26) NOT NULL,
    name text NOT NULL,
    species text NOT NULL,
    lineage text,
    background text NOT NULL,
    alignment text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    ruleset text DEFAULT 'srd51'::text NOT NULL,
    avatar_id text,
    archived_at timestamp with time zone
);


--
-- Name: COLUMN characters.archived_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.characters.archived_at IS 'Timestamp when the character was archived. NULL means the character is active.';


--
-- Name: chat_messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.chat_messages (
    id character varying(26) NOT NULL,
    character_id character varying(26) NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    tool_calls jsonb,
    tool_results jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT chat_messages_role_check CHECK ((role = ANY (ARRAY['user'::text, 'assistant'::text, 'system'::text])))
);


--
-- Name: item_charges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_charges (
    id character varying(26) NOT NULL,
    item_id character varying(26) NOT NULL,
    delta integer NOT NULL,
    note text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: item_damage; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_damage (
    id character varying(26) NOT NULL,
    item_id character varying(26) NOT NULL,
    dice integer[] NOT NULL,
    type text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    versatile boolean DEFAULT false,
    CONSTRAINT item_damage_type_check CHECK ((type = ANY (ARRAY['slashing'::text, 'piercing'::text, 'bludgeoning'::text, 'fire'::text, 'cold'::text, 'lightning'::text, 'thunder'::text, 'acid'::text, 'radiant'::text, 'necrotic'::text, 'force'::text, 'poison'::text, 'psychic'::text])))
);


--
-- Name: item_effects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.item_effects (
    id character varying(26) NOT NULL,
    item_id character varying(26) NOT NULL,
    target text NOT NULL,
    op text NOT NULL,
    value integer,
    applies text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT item_effects_applies_check CHECK (((applies IS NULL) OR (applies = ANY (ARRAY['worn'::text, 'wielded'::text])))),
    CONSTRAINT item_effects_op_check CHECK ((op = ANY (ARRAY['add'::text, 'set'::text, 'advantage'::text, 'disadvantage'::text, 'proficiency'::text, 'expertise'::text])))
);


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id character varying(26) NOT NULL,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    armor_type text,
    armor_class integer,
    armor_class_dex boolean DEFAULT false,
    armor_class_dex_max integer,
    armor_modifier integer,
    normal_range integer,
    long_range integer,
    thrown boolean DEFAULT false,
    finesse boolean DEFAULT false,
    mastery text,
    martial boolean DEFAULT false,
    created_by character varying(26) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    light boolean DEFAULT false,
    heavy boolean DEFAULT false,
    two_handed boolean DEFAULT false,
    reach boolean DEFAULT false,
    loading boolean DEFAULT false,
    min_strength integer,
    CONSTRAINT items_armor_class_check CHECK ((armor_class >= 0)),
    CONSTRAINT items_armor_class_dex_max_check CHECK ((armor_class_dex_max >= 0)),
    CONSTRAINT items_armor_type_check CHECK ((armor_type = ANY (ARRAY['light'::text, 'medium'::text, 'heavy'::text]))),
    CONSTRAINT items_category_check CHECK ((category = ANY (ARRAY['weapon'::text, 'armor'::text, 'shield'::text, 'clothing'::text, 'jewelry'::text, 'potion'::text, 'scroll'::text, 'gear'::text, 'tool'::text, 'container'::text, 'wand'::text, 'misc'::text]))),
    CONSTRAINT items_long_range_check CHECK ((long_range > 0)),
    CONSTRAINT items_mastery_check CHECK ((mastery = ANY (ARRAY['cleave'::text, 'graze'::text, 'nick'::text, 'push'::text, 'sap'::text, 'slow'::text, 'topple'::text, 'vex'::text]))),
    CONSTRAINT items_normal_range_check CHECK ((normal_range > 0))
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
);


--
-- Name: uploads; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.uploads (
    id text NOT NULL,
    user_id text NOT NULL,
    status text NOT NULL,
    content_type text NOT NULL,
    size_bytes bigint,
    original_filename text,
    s3_key text,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    completed_at timestamp without time zone,
    CONSTRAINT uploads_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'complete'::text, 'failed'::text])))
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying(26) NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: auth_tokens auth_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.auth_tokens
    ADD CONSTRAINT auth_tokens_pkey PRIMARY KEY (id);


--
-- Name: char_abilities char_abilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_abilities
    ADD CONSTRAINT char_abilities_pkey PRIMARY KEY (id);


--
-- Name: char_coins char_coins_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_coins
    ADD CONSTRAINT char_coins_pkey PRIMARY KEY (id);


--
-- Name: char_hit_dice char_hit_dice_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_hit_dice
    ADD CONSTRAINT char_hit_dice_pkey PRIMARY KEY (id);


--
-- Name: char_hp char_hp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_hp
    ADD CONSTRAINT char_hp_pkey PRIMARY KEY (id);


--
-- Name: char_items char_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_items
    ADD CONSTRAINT char_items_pkey PRIMARY KEY (id);


--
-- Name: char_levels char_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_levels
    ADD CONSTRAINT char_levels_pkey PRIMARY KEY (id);


--
-- Name: char_notes char_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_notes
    ADD CONSTRAINT char_notes_pkey PRIMARY KEY (id);


--
-- Name: char_skills char_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_skills
    ADD CONSTRAINT char_skills_pkey PRIMARY KEY (id);


--
-- Name: char_spell_slots char_spell_slots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_spell_slots
    ADD CONSTRAINT char_spell_slots_pkey PRIMARY KEY (id);


--
-- Name: char_spells_learned char_spells_learned_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_spells_learned
    ADD CONSTRAINT char_spells_learned_pkey PRIMARY KEY (id);


--
-- Name: char_spells_prepared char_spells_prepared_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_spells_prepared
    ADD CONSTRAINT char_spells_prepared_pkey PRIMARY KEY (id);


--
-- Name: char_traits char_traits_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_traits
    ADD CONSTRAINT char_traits_pkey PRIMARY KEY (id);


--
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: chat_messages chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_pkey PRIMARY KEY (id);


--
-- Name: item_charges item_charges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_charges
    ADD CONSTRAINT item_charges_pkey PRIMARY KEY (id);


--
-- Name: item_damage item_damage_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_damage
    ADD CONSTRAINT item_damage_pkey PRIMARY KEY (id);


--
-- Name: item_effects item_effects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_effects
    ADD CONSTRAINT item_effects_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: uploads uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_auth_tokens_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_tokens_email ON public.auth_tokens USING btree (email);


--
-- Name: idx_auth_tokens_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_tokens_expires_at ON public.auth_tokens USING btree (expires_at);


--
-- Name: idx_auth_tokens_session_token_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_auth_tokens_session_token_hash ON public.auth_tokens USING btree (session_token_hash);


--
-- Name: idx_char_abilities_char_id_ability_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_abilities_char_id_ability_created_at ON public.char_abilities USING btree (character_id, ability, created_at);


--
-- Name: idx_char_coins_char_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_coins_char_id_created_at ON public.char_coins USING btree (character_id, created_at);


--
-- Name: idx_char_hit_dice_char_id_die_value_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_hit_dice_char_id_die_value_created_at ON public.char_hit_dice USING btree (character_id, die_value, created_at);


--
-- Name: idx_char_hp_char_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_hp_char_id_created_at ON public.char_hp USING btree (character_id, created_at);


--
-- Name: idx_char_items_char_id_item_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_items_char_id_item_id_created_at ON public.char_items USING btree (character_id, item_id, created_at);


--
-- Name: idx_char_items_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_items_item_id ON public.char_items USING btree (item_id);


--
-- Name: idx_char_levels_char_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_levels_char_id_created_at ON public.char_levels USING btree (character_id, created_at);


--
-- Name: idx_char_notes_character_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_notes_character_id_created_at ON public.char_notes USING btree (character_id, created_at DESC);


--
-- Name: idx_char_skills_char_id_skill_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_skills_char_id_skill_created_at ON public.char_skills USING btree (character_id, skill, created_at);


--
-- Name: idx_char_spell_slots_char_id_slot_level_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_spell_slots_char_id_slot_level_created_at ON public.char_spell_slots USING btree (character_id, slot_level, created_at);


--
-- Name: idx_char_spells_learned_char_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_spells_learned_char_id ON public.char_spells_learned USING btree (character_id);


--
-- Name: idx_char_spells_learned_spell_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_spells_learned_spell_id ON public.char_spells_learned USING btree (spell_id);


--
-- Name: idx_char_spells_prepared_char_id_class; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_spells_prepared_char_id_class ON public.char_spells_prepared USING btree (character_id, class);


--
-- Name: idx_char_spells_prepared_spell_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_spells_prepared_spell_id ON public.char_spells_prepared USING btree (spell_id);


--
-- Name: idx_char_traits_char_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_traits_char_id ON public.char_traits USING btree (character_id, created_at);


--
-- Name: idx_characters_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_characters_user_id ON public.characters USING btree (user_id);


--
-- Name: idx_characters_user_id_archived_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_characters_user_id_archived_at ON public.characters USING btree (user_id, archived_at);


--
-- Name: idx_chat_messages_character_created; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_chat_messages_character_created ON public.chat_messages USING btree (character_id, created_at DESC);


--
-- Name: idx_item_charges_item_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_charges_item_id_created_at ON public.item_charges USING btree (item_id, created_at);


--
-- Name: idx_item_damage_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_damage_item_id ON public.item_damage USING btree (item_id);


--
-- Name: idx_item_effects_item_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_item_effects_item_id ON public.item_effects USING btree (item_id);


--
-- Name: idx_items_category; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_category ON public.items USING btree (category);


--
-- Name: idx_items_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_items_created_by ON public.items USING btree (created_by);


--
-- Name: idx_uploads_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uploads_status ON public.uploads USING btree (status);


--
-- Name: idx_uploads_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_uploads_user_id ON public.uploads USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: char_abilities char_abilities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_abilities_updated_at BEFORE UPDATE ON public.char_abilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_coins char_coins_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_coins_updated_at BEFORE UPDATE ON public.char_coins FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_hit_dice char_hit_dice_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_hit_dice_updated_at BEFORE UPDATE ON public.char_hit_dice FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_hp char_hp_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_hp_updated_at BEFORE UPDATE ON public.char_hp FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_items char_items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_items_updated_at BEFORE UPDATE ON public.char_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_levels char_levels_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_levels_updated_at BEFORE UPDATE ON public.char_levels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_skills char_skills_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_skills_updated_at BEFORE UPDATE ON public.char_skills FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_spell_slots char_spell_slots_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_spell_slots_updated_at BEFORE UPDATE ON public.char_spell_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_spells_learned char_spells_learned_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_spells_learned_updated_at BEFORE UPDATE ON public.char_spells_learned FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_spells_prepared char_spells_prepared_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_spells_prepared_updated_at BEFORE UPDATE ON public.char_spells_prepared FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_traits char_traits_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_traits_updated_at BEFORE UPDATE ON public.char_traits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: characters characters_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER characters_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: item_charges item_charges_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER item_charges_updated_at BEFORE UPDATE ON public.item_charges FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: items items_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER items_updated_at BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_notes update_char_notes_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_char_notes_updated_at BEFORE UPDATE ON public.char_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_abilities char_abilities_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_abilities
    ADD CONSTRAINT char_abilities_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: char_coins char_coins_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_coins
    ADD CONSTRAINT char_coins_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: char_hit_dice char_hit_dice_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_hit_dice
    ADD CONSTRAINT char_hit_dice_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: char_hp char_hp_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_hp
    ADD CONSTRAINT char_hp_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: char_items char_items_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_items
    ADD CONSTRAINT char_items_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: char_items char_items_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_items
    ADD CONSTRAINT char_items_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: char_levels char_levels_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_levels
    ADD CONSTRAINT char_levels_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: char_notes char_notes_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_notes
    ADD CONSTRAINT char_notes_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: char_notes char_notes_restored_from_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_notes
    ADD CONSTRAINT char_notes_restored_from_id_fkey FOREIGN KEY (restored_from_id) REFERENCES public.char_notes(id) ON DELETE SET NULL;


--
-- Name: char_skills char_skills_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_skills
    ADD CONSTRAINT char_skills_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: char_spell_slots char_spell_slots_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_spell_slots
    ADD CONSTRAINT char_spell_slots_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: char_spells_learned char_spells_learned_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_spells_learned
    ADD CONSTRAINT char_spells_learned_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: char_spells_prepared char_spells_prepared_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_spells_prepared
    ADD CONSTRAINT char_spells_prepared_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: char_traits char_traits_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_traits
    ADD CONSTRAINT char_traits_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: characters characters_avatar_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_avatar_id_fkey FOREIGN KEY (avatar_id) REFERENCES public.uploads(id);


--
-- Name: characters characters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: chat_messages chat_messages_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.chat_messages
    ADD CONSTRAINT chat_messages_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


--
-- Name: uploads fk_user; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.uploads
    ADD CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: item_charges item_charges_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_charges
    ADD CONSTRAINT item_charges_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: item_damage item_damage_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_damage
    ADD CONSTRAINT item_damage_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: item_effects item_effects_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.item_effects
    ADD CONSTRAINT item_effects_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.items(id) ON DELETE CASCADE;


--
-- Name: items items_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict ELRYEllzgERsiV4l7JhasXJTPmeatB0eNXTllLbpb7Zue2jrzquGINTlUxO5fUc


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20250924190507'),
    ('20250929165649'),
    ('20251001204923'),
    ('20251002222515'),
    ('20251003120515'),
    ('20251003124131'),
    ('20251003131932'),
    ('20251003140146'),
    ('20251003140147'),
    ('20251004105657'),
    ('20251007100000'),
    ('20251007100001'),
    ('20251014115526'),
    ('20251017195912'),
    ('20251017232744'),
    ('20251020180932'),
    ('20251020181000'),
    ('20251020212355'),
    ('20251021163000'),
    ('20251024193356'),
    ('20251025005815'),
    ('20251025215747'),
    ('20251025215832'),
    ('20251025215908'),
    ('20251025220018'),
    ('20251025220128'),
    ('20251027195737'),
    ('20251028010531'),
    ('20251029183629');
