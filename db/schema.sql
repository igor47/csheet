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
    ruleset text DEFAULT 'srd51'::text NOT NULL
);


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying NOT NULL
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
-- Name: char_abilities char_abilities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_abilities
    ADD CONSTRAINT char_abilities_pkey PRIMARY KEY (id);


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
-- Name: char_levels char_levels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_levels
    ADD CONSTRAINT char_levels_pkey PRIMARY KEY (id);


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
-- Name: characters characters_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_char_abilities_char_id_ability_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_abilities_char_id_ability_created_at ON public.char_abilities USING btree (character_id, ability, created_at);


--
-- Name: idx_char_hit_dice_char_id_die_value_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_hit_dice_char_id_die_value_created_at ON public.char_hit_dice USING btree (character_id, die_value, created_at);


--
-- Name: idx_char_hp_char_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_hp_char_id_created_at ON public.char_hp USING btree (character_id, created_at);


--
-- Name: idx_char_levels_char_id_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_char_levels_char_id_created_at ON public.char_levels USING btree (character_id, created_at);


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
-- Name: idx_characters_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_characters_user_id ON public.characters USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: char_abilities char_abilities_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_abilities_updated_at BEFORE UPDATE ON public.char_abilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_hit_dice char_hit_dice_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_hit_dice_updated_at BEFORE UPDATE ON public.char_hit_dice FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: char_hp char_hp_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER char_hp_updated_at BEFORE UPDATE ON public.char_hp FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
-- Name: characters characters_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER characters_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


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
-- Name: char_levels char_levels_character_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.char_levels
    ADD CONSTRAINT char_levels_character_id_fkey FOREIGN KEY (character_id) REFERENCES public.characters(id) ON DELETE CASCADE;


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
-- Name: characters characters_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.characters
    ADD CONSTRAINT characters_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--


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
    ('20251017232744');
