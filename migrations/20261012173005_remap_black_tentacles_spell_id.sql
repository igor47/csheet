-- migrate:up
-- Black Tentacles and Blade Barrier both had the spell id srd_blade_barrier, and lookups found
-- Black Tentacles first, so no cleric could ever prepare Blade Barrier ("Cannot prepare Black
-- Tentacles as a cleric"). Every existing srd_blade_barrier row is really Black Tentacles, which
-- now has its own id. Learned spells are wizard-only; prepared rows skip clerics just in case.
UPDATE char_spells_learned SET spell_id = 'srd_black_tentacles'
WHERE spell_id = 'srd_blade_barrier';

UPDATE char_spells_prepared SET spell_id = 'srd_black_tentacles'
WHERE spell_id = 'srd_blade_barrier' AND class <> 'cleric';

-- migrate:down
-- srd_black_tentacles didn't exist before, so every row with it was remapped
UPDATE char_spells_learned SET spell_id = 'srd_blade_barrier'
WHERE spell_id = 'srd_black_tentacles';

UPDATE char_spells_prepared SET spell_id = 'srd_blade_barrier'
WHERE spell_id = 'srd_black_tentacles';
