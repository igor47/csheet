import { Hono } from 'hono'
import { Character } from '@src/components/Character'
import { CharacterNew } from '@src/components/CharacterNew'
import { Characters } from '@src/components/Characters'
import { CharacterInfo } from '@src/components/CharacterInfo'
import { ClassEditForm } from '@src/components/ClassEditForm'
import { ClassHistory } from '@src/components/ClassHistory'
import { HitPointsEditForm } from '@src/components/HitPointsEditForm'
import { HitPointsHistory, type HPHistoryEvent } from '@src/components/HitPointsHistory'
import { HitDiceEditForm } from '@src/components/HitDiceEditForm'
import { HitDiceHistory } from '@src/components/HitDiceHistory'
import { SpellSlotsEditForm } from '@src/components/SpellSlotsEditForm'
import { SpellSlotsHistory } from '@src/components/SpellSlotsHistory'
import { AbilityEditForm } from '@src/components/AbilityEditForm'
import { AbilityHistory } from '@src/components/AbilityHistory'
import { SkillEditForm } from '@src/components/SkillEditForm'
import { SkillHistory } from '@src/components/SkillHistory'
import { LearnSpellForm } from '@src/components/LearnSpellForm'
import { PrepareSpellForm } from '@src/components/PrepareSpellForm'
import { PreparedSpellsHistory } from '@src/components/PreparedSpellsHistory'
import { SpellbookHistory } from '@src/components/SpellbookHistory'
import { findByUserId, nameExistsForUser } from '@src/db/characters'
import { getCurrentLevels, maxClassLevel, findByCharacterId } from '@src/db/char_levels'
import { findByCharacterId as findHPChanges } from '@src/db/char_hp'
import { findByCharacterId as findHitDiceChanges } from '@src/db/char_hit_dice'
import { findByCharacterId as findSpellSlotChanges } from '@src/db/char_spell_slots'
import { findByCharacterId as findAbilityChanges } from '@src/db/char_abilities'
import { findByCharacterId as findSkillChanges } from '@src/db/char_skills'
import { findByCharacterId as findPreparedSpellChanges } from '@src/db/char_spells_prepared'
import { getCurrentLearnedSpells, findByCharacterId as findLearnedSpellChanges } from '@src/db/char_spells_learned'
import { createCharacter, CreateCharacterApiSchema } from '@src/services/createCharacter'
import { computeCharacter } from '@src/services/computeCharacter'
import { addLevel, AddLevelApiSchema, prepareAddLevelForm, validateAddLevel } from '@src/services/addLevel'
import { updateHitPoints, UpdateHitPointsApiSchema, prepareUpdateHitPointsForm, validateUpdateHitPoints } from '@src/services/updateHitPoints'
import { updateHitDice, UpdateHitDiceApiSchema, prepareUpdateHitDiceForm, validateUpdateHitDice } from '@src/services/updateHitDice'
import { updateSpellSlots, UpdateSpellSlotsApiSchema, prepareUpdateSpellSlotsForm, validateUpdateSpellSlots } from '@src/services/updateSpellSlots'
import { updateAbility, UpdateAbilityApiSchema, prepareUpdateAbilityForm, validateUpdateAbility } from '@src/services/updateAbility'
import { updateSkill, UpdateSkillApiSchema, prepareUpdateSkillForm, validateUpdateSkill } from '@src/services/updateSkill'
import { longRest, LongRestApiSchema } from '@src/services/longRest'
import { learnSpell, LearnSpellApiSchema } from '@src/services/learnSpell'
import { prepareSpell } from '@src/services/prepareSpell'
import { getMaxSpellLevel } from '@src/services/computeSpells'
import { Abilities, Skills, SkillAbilities, type AbilityType, type SkillType, Classes, type ClassNameType } from '@src/lib/dnd'
import { spells } from '@src/lib/dnd/spells'
import { setFlashMsg } from '@src/middleware/flash'
import { zodToFormErrors } from '@src/lib/formErrors'
import { db } from '@src/db'
import { SpellsPanel } from '@src/components/panels/SpellsPanel'
import { AbilitiesPanel } from '@src/components/panels/AbilitiesPanel'
import { SkillsPanel } from '@src/components/panels/SkillsPanel'
import { CurrentStatus } from '@src/components/CurrentStatus'

export const characterRoutes = new Hono()

characterRoutes.get('/characters', async (c) => {
  const user = c.var.user!

  const characters = await findByUserId(db, user.id)
  if (characters.length === 0) {
    await setFlashMsg(c, 'Create a character to get started!', 'info');
    return c.redirect('/characters/new');
  }

  return c.render(<Characters characters={characters} />, { title: "My Characters" })
})

characterRoutes.get('/characters/new', (c) => {
  return c.render(<CharacterNew />, { title: "New Character" })
})

characterRoutes.post('/characters/new/check', async (c) => {
  const user = c.var.user!

  const body = await c.req.parseBody() as Record<string, string>
  const values = body
  const errors: Record<string, string> = {}

  // Validate name if provided
  if (values.name) {
    if (values.name.trim().length === 0) {
      errors.name = "Character name is required"
    } else {
      const exists = await nameExistsForUser(db, user.id, values.name)
      if (exists) {
        errors.name = "You already have a character with this name"
      }
    }
  }

  return c.html(<CharacterNew values={values} errors={Object.keys(errors).length > 0 ? errors : undefined} />)
})

characterRoutes.post('/characters/new', async (c) => {
  const user = c.var.user!

  const body = await c.req.parseBody() as Record<string, string>
  const values = {...body, user_id: user.id}

  const result = CreateCharacterApiSchema.safeParse(values)
  if (!result.success) {
    const errors = zodToFormErrors(result.error)
    return c.html(<CharacterNew values={values} errors={errors} />)
  }

  try {
    const character = await createCharacter(result.data)
    await setFlashMsg(c, 'Character created successfully!', 'success');
    c.header('HX-Redirect', `/characters/${character.id}`)
    return c.body(null, 204)
  } catch (error) {
    console.error("creating character", error)
    const errorMsg = error instanceof Error ? error.message : "Failed to create character"
    await setFlashMsg(c, errorMsg, 'error');
    return c.html(<CharacterNew values={values} />)
  }
})

characterRoutes.get('/characters/:id', async (c) => {
  const id = c.req.param('id') as string;
  const char = await computeCharacter(db, id);
  if (!char) {
    await setFlashMsg(c, 'Character not found', 'error');
    return c.redirect('/characters');
  }

  return c.render(<Character character={char} />, { title: "Character Sheet" })
})

characterRoutes.post('/characters/:id/edit/class/check', async (c) => {
  const characterId = c.req.param('id') as string;
  const body = await c.req.parseBody() as Record<string, string>;

  // Get current levels to calculate the correct level
  const currentLevels = await getCurrentLevels(db, characterId);
  const currentClassLevel = currentLevels.find(cl => cl.class === body.class) || null

  // Prepare form values and get soft validation hints
  const { values, errors } = prepareAddLevelForm(body, currentLevels);
  return c.html(<ClassEditForm characterId={characterId} currentClassLevel={currentClassLevel} values={values} errors={Object.keys(errors).length > 0 ? errors : undefined} />);
})

characterRoutes.post('/characters/:id/edit/hitpoints/check', async (c) => {
  const characterId = c.req.param('id') as string;
  const body = await c.req.parseBody() as Record<string, string>;

  const char = await computeCharacter(db, characterId);
  if (!char) {
    return c.html(<>
      <div class="modal-header">
        <h5 class="modal-title">Error</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="alert alert-danger">Character not found</div>
      </div>
    </>);
  }

  const { values, errors } = prepareUpdateHitPointsForm(body, char.currentHP, char.maxHitPoints);
  return c.html(<HitPointsEditForm characterId={characterId} currentHP={char.currentHP} maxHitPoints={char.maxHitPoints} values={values} errors={Object.keys(errors).length > 0 ? errors : undefined} />);
})

characterRoutes.post('/characters/:id/edit/hitdice/check', async (c) => {
  const characterId = c.req.param('id') as string;
  const body = await c.req.parseBody() as Record<string, string>;

  const char = await computeCharacter(db, characterId);
  if (!char) {
    return c.html(<>
      <div class="modal-header">
        <h5 class="modal-title">Error</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="alert alert-danger">Character not found</div>
      </div>
    </>);
  }

  const { values, errors } = prepareUpdateHitDiceForm(body, char.hitDice, char.availableHitDice);
  return c.html(<HitDiceEditForm characterId={characterId} allHitDice={char.hitDice} availableHitDice={char.availableHitDice} values={values} errors={Object.keys(errors).length > 0 ? errors : undefined} />);
})

characterRoutes.post('/characters/:id/edit/spellslots/check', async (c) => {
  const characterId = c.req.param('id') as string;
  const body = await c.req.parseBody() as Record<string, string>;

  const char = await computeCharacter(db, characterId);
  if (!char) {
    return c.html(<>
      <div class="modal-header">
        <h5 class="modal-title">Error</h5>
        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
      </div>
      <div class="modal-body">
        <div class="alert alert-danger">Character not found</div>
      </div>
    </>);
  }

  const { values, errors } = prepareUpdateSpellSlotsForm(body, char.spellSlots, char.availableSpellSlots);
  return c.html(<SpellSlotsEditForm characterId={characterId} allSlots={char.spellSlots} availableSlots={char.availableSpellSlots} values={values} errors={Object.keys(errors).length > 0 ? errors : undefined} />);
})


characterRoutes.post('/characters/:id/edit/class', async (c) => {
  const characterId = c.req.param('id') as string;
  const body = await c.req.parseBody() as Record<string, string>;

  // Get current levels for validation
  const currentLevels = await getCurrentLevels(db, characterId);
  const currentClassLevel = currentLevels.find(cl => cl.class === body.class) || null

  // Strict validation (no mutation)
  const validation = validateAddLevel(body, currentLevels);

  if (!validation.valid) {
    return c.html(<ClassEditForm characterId={characterId} currentClassLevel={currentClassLevel} values={body} errors={validation.errors} />);
  }

  // Parse with Zod
  const result = AddLevelApiSchema.safeParse({
    character_id: characterId,
    class: body.class,
    level: parseInt(body.level || ''),
    subclass: body.subclass || null,
    hit_die_roll: parseInt(body.hit_die_roll || ''),
    note: body.note || null,
  });

  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      errors[field] = issue.message;
    }
    return c.html(<ClassEditForm characterId={characterId} currentClassLevel={currentClassLevel} values={body} errors={errors} />);
  }

  try {
    await addLevel(db, result.data);

  } catch (error) {
    console.error("adding level", error);
    await setFlashMsg(c, 'Failed to add level', 'error');
    return c.html(<ClassEditForm characterId={characterId} currentClassLevel={currentClassLevel} values={body} />);
  }

  const updatedChar = (await computeCharacter(db, characterId))!;
  return c.html(<>
    <CharacterInfo character={updatedChar} />
    <AbilitiesPanel character={updatedChar} swapOob={true} />
    <SkillsPanel character={updatedChar} swapOob={true} />
    <SpellsPanel character={updatedChar} swapOob={true} />
  </>)

})

characterRoutes.post('/characters/:id/edit/hitpoints', async (c) => {
  const characterId = c.req.param('id') as string;
  const body = await c.req.parseBody() as Record<string, string>;

  const char = await computeCharacter(db, characterId);
  if (!char) {
    await setFlashMsg(c, 'Character not found', 'error');
    c.header('HX-Redirect', `/characters`);
    return c.body(null, 204);
  }

  // Strict validation (no mutation)
  const validation = validateUpdateHitPoints(body, char.currentHP, char.maxHitPoints);

  if (!validation.valid) {
    return c.html(<HitPointsEditForm characterId={characterId} currentHP={char.currentHP} maxHitPoints={char.maxHitPoints} values={body} errors={validation.errors} />);
  }

  // Parse with Zod
  const result = UpdateHitPointsApiSchema.safeParse({
    character_id: characterId,
    action: body.action,
    amount: parseInt(body.amount || ''),
    note: body.note || null,
  });

  if (!result.success) {
    const errors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      errors[field] = issue.message;
    }
    return c.html(<HitPointsEditForm characterId={characterId} currentHP={char.currentHP} maxHitPoints={char.maxHitPoints} values={body} errors={errors} />);
  }

  try {
    await updateHitPoints(db, result.data);
  } catch (error) {
    console.error("updating hit points", error);
    return c.html(<HitPointsEditForm characterId={characterId} currentHP={char.currentHP} maxHitPoints={char.maxHitPoints} values={body} errors={{ amount: 'Failed to update hit points' }} />);
  }

  const updatedChar = (await computeCharacter(db, characterId))!;

  c.header('HX-Trigger', 'closeEditModal');
  return c.html(<>
    <CharacterInfo character={updatedChar} swapOob={true} />
    <CurrentStatus character={updatedChar} swapOob={true} />
  </>);
})

characterRoutes.post('/characters/:id/edit/hitdice', async (c) => {
  const characterId = c.req.param('id') as string;
  const char = await computeCharacter(db, characterId);
  if (!char) {
    await setFlashMsg(c, 'Character not found', 'error');
    c.header('HX-Redirect', `/characters`);
    return c.body(null, 204);
  }

  // Strict validation (no mutation)
  const body = await c.req.parseBody() as Record<string, string>;
  const validation = validateUpdateHitDice(body, char.hitDice, char.availableHitDice);

  if (!validation.valid) {
    return c.html(<HitDiceEditForm characterId={characterId} allHitDice={char.hitDice} availableHitDice={char.availableHitDice} values={body} errors={validation.errors} />);
  }

  // Parse with Zod
  const result = UpdateHitDiceApiSchema.safeParse({
    character_id: characterId,
    action: body.action,
    die_value: body.die_value ? parseInt(body.die_value) : null,
    hp_rolled: body.hp_rolled ? parseInt(body.hp_rolled) : null,
    note: body.note || null,
  });

  if (!result.success) {
    const errors = zodToFormErrors(result.error)
    return c.html(<HitDiceEditForm characterId={characterId} allHitDice={char.hitDice} availableHitDice={char.availableHitDice} values={body} errors={errors} />);
  }

  try {
    await updateHitDice(db, result.data, char.hitDice, char.availableHitDice, char.currentHP, char.maxHitPoints);
  } catch (error) {
    console.error("updating hit dice", error);
    return c.html(<HitDiceEditForm characterId={characterId} allHitDice={char.hitDice} availableHitDice={char.availableHitDice} values={body} errors={{ action: 'Failed to update hit dice' }} />);
  }

  const updatedChar = (await computeCharacter(db, characterId))!;
  c.header('HX-Trigger', 'closeEditModal');
  return c.html(<>
    <CharacterInfo character={updatedChar} swapOob={true} />
    <CurrentStatus character={updatedChar} swapOob={true} />
  </>);
})

characterRoutes.post('/characters/:id/edit/spellslots', async (c) => {
  const characterId = c.req.param('id') as string;
  const char = await computeCharacter(db, characterId);
  if (!char) {
    await setFlashMsg(c, 'Character not found', 'error');
    c.header('HX-Redirect', `/characters`);
    return c.body(null, 204);
  }

  // Strict validation (no mutation)
  const body = await c.req.parseBody() as Record<string, string>;
  const validation = validateUpdateSpellSlots(body, char.spellSlots, char.availableSpellSlots);

  if (!validation.valid) {
    return c.html(<SpellSlotsEditForm characterId={characterId} allSlots={char.spellSlots} availableSlots={char.availableSpellSlots} values={body} errors={validation.errors} />);
  }

  // Parse with Zod
  const result = UpdateSpellSlotsApiSchema.safeParse({
    character_id: characterId,
    action: body.action,
    slot_level: body.slot_level ? parseInt(body.slot_level) : null,
    note: body.note || null,
  });

  if (!result.success) {
    const errors = zodToFormErrors(result.error)
    return c.html(<SpellSlotsEditForm characterId={characterId} allSlots={char.spellSlots} availableSlots={char.availableSpellSlots} values={body} errors={errors} />);
  }

  try {
    await updateSpellSlots(db, result.data, char.spellSlots, char.availableSpellSlots);
  } catch (error) {
    console.error("updating spell slots", error);
    return c.html(<SpellSlotsEditForm characterId={characterId} allSlots={char.spellSlots} availableSlots={char.availableSpellSlots} values={body} errors={{ action: 'Failed to update spell slots' }} />);
  }

  const updatedChar = (await computeCharacter(db, characterId))!;
  c.header('HX-Trigger', 'closeEditModal');
  return c.html(<>
    <SpellsPanel character={updatedChar} swapOob={true} />
    <CurrentStatus character={updatedChar} swapOob={true} />
  </>)
})


characterRoutes.post('/characters/:id/edit/prepspell', async (c) => {
  const characterId = c.req.param('id') as string;
  const body = await c.req.parseBody() as Record<string, string>;

  const char = await computeCharacter(db, characterId);
  if (!char) {
    await setFlashMsg(c, 'Character not found', 'error');
    c.header('HX-Redirect', `/characters`);
    return c.body(null, 204);
  }

  const result = await prepareSpell(db, char, body);

  if (!result.complete) {
    return c.html(<PrepareSpellForm
      character={char}
      values={result.values}
      errors={result.errors}
    />);
  }

  const updatedChar = (await computeCharacter(db, characterId))!;
  c.header('HX-Trigger', 'closeEditModal');
  return c.html(<SpellsPanel character={updatedChar} swapOob={true} />);
})

characterRoutes.post('/characters/:id/edit/spellbook', async (c) => {
  const characterId = c.req.param('id') as string;
  const body = await c.req.parseBody() as Record<string, string>;

  const char = await computeCharacter(db, characterId);
  if (!char) {
    await setFlashMsg(c, 'Character not found', 'error');
    c.header('HX-Redirect', `/characters`);
    return c.body(null, 204);
  }

  const result = await learnSpell(db, char, body);

  if (!result.complete) {
    return c.html(<LearnSpellForm
      character={char}
      values={result.values}
      errors={result.errors}
    />);
  }

  const updatedChar = (await computeCharacter(db, characterId))!;
  c.header('HX-Trigger', 'closeEditModal');
  return c.html(<>
    <SpellsPanel character={updatedChar} swapOob={true} />
  </>)
})

characterRoutes.post('/characters/:id/longrest', async (c) => {
  const characterId = c.req.param('id') as string;
  const char = await computeCharacter(db, characterId);
  if (!char) {
    await setFlashMsg(c, 'Character not found', 'error');
    c.header('HX-Redirect', `/characters`);
    return c.body(null, 204);
  }

  // Parse with Zod
  const result = LongRestApiSchema.safeParse({
    character_id: characterId,
    note: null,
  });

  if (!result.success) {
    await setFlashMsg(c, 'Failed to take long rest', 'error');
    return c.html(<CurrentStatus character={char} />);
  }

  try {
    const summary = await longRest(
      db,
      result.data,
      char.currentHP,
      char.maxHitPoints,
      char.hitDice,
      char.availableHitDice,
      char.spellSlots,
      char.availableSpellSlots
    );

    // Build summary message
    const summaryParts: string[] = [];
    if (summary.hpRestored > 0) summaryParts.push(`${summary.hpRestored} HP`);
    if (summary.hitDiceRestored > 0) summaryParts.push(`${summary.hitDiceRestored} hit dice`);
    if (summary.spellSlotsRestored > 0) summaryParts.push(`${summary.spellSlotsRestored} spell slots`);

    const message = summaryParts.length > 0
      ? `Long rest complete! Restored: ${summaryParts.join(', ')}`
      : 'Long rest complete!';

    await setFlashMsg(c, message, 'success');
  } catch (error) {
    console.error("taking long rest", error);
    await setFlashMsg(c, 'Failed to take long rest', 'error');
    return c.html(<CurrentStatus character={char} />);
  }

  const updatedChar = (await computeCharacter(db, characterId))!;
  return c.html(<>
    <CurrentStatus character={updatedChar} />
    <CharacterInfo character={updatedChar} swapOob={true} />
    <SpellsPanel character={updatedChar} swapOob={true} />
  </>);
})

characterRoutes.get('/characters/:id/edit/:field', async (c) => {
  const characterId = c.req.param('id') as string;
  const field = c.req.param('field') as string;

  const char = await computeCharacter(db, characterId);
  if (!char) {
    await setFlashMsg(c, 'Character not found', 'error');
    c.header('HX-Redirect', `/characters`);
    return c.body(null, 204);
  }

  if (char.user_id !== c.var.user!.id) {
    await setFlashMsg(c, 'You do not have permission to edit this character')
    c.header('HX-Redirect', `/characters`);
    return c.body(null, 403);
  }


  if (field === 'class') {
    const currentLevels = await getCurrentLevels(db, characterId);
    const maxLevel  = await maxClassLevel(db, characterId);
    const { values } = prepareAddLevelForm({ class: maxLevel.class }, currentLevels);

    return c.html(<ClassEditForm characterId={characterId} currentClassLevel={maxLevel} values={values} />);
  }

  if (field === 'hitpoints') {
    const char = await computeCharacter(db, characterId);
    if (!char) {
      return c.html(<>
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Character not found</div>
        </div>
      </>);
    }

    const defaultAction = char.currentHP >= char.maxHitPoints ? 'lose' : 'restore';
    const values = { action: defaultAction, amount: '' };
    return c.html(<HitPointsEditForm characterId={characterId} currentHP={char.currentHP} maxHitPoints={char.maxHitPoints} values={values} />);
  }

  if (field === 'hitdice') {
    const char = await computeCharacter(db, characterId);
    if (!char) {
      return c.html(<>
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Character not found</div>
        </div>
      </>);
    }

    const defaultAction = char.availableHitDice.length < char.hitDice.length ? 'restore' : 'spend';
    const values = { action: defaultAction };
    return c.html(<HitDiceEditForm characterId={characterId} allHitDice={char.hitDice} availableHitDice={char.availableHitDice} values={values} />);
  }

  if (field === 'spellslots') {
    const char = await computeCharacter(db, characterId);
    if (!char) {
      return c.html(<>
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Character not found</div>
        </div>
      </>);
    }

    return c.html(<SpellSlotsEditForm characterId={characterId} allSlots={char.spellSlots} availableSlots={char.availableSpellSlots} />);
  }

  if (field === 'prepspell') {
    // Parse query params
    const values: Record<string, string> = {};
    for (const qField of ['class', 'spell_type', 'current_spell_id']) {
      const val = c.req.query(qField);
      if (val) {
        values[qField] = val
      }
    }

    return c.html(<PrepareSpellForm character={char} values={values} />);
  }

  if (field === 'spellbook') {
    return c.html(<LearnSpellForm character={char}/>);
  }

  // Check if field is an ability
  if (Abilities.includes(field as AbilityType)) {
    const char = await computeCharacter(db, characterId);
    if (!char) {
      return c.html(<>
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Character not found</div>
        </div>
      </>);
    }

    const ability = field as AbilityType;
    const abilityScore = char.abilityScores[ability];
    const values = {
      score: abilityScore.score.toString(),
      proficiency_change: 'none',
    };

    return c.html(<AbilityEditForm
      characterId={characterId}
      ability={ability}
      currentScore={abilityScore.score}
      currentModifier={abilityScore.modifier}
      isProficient={abilityScore.proficient}
      proficiencyBonus={char.proficiencyBonus}
      values={values}
    />);
  }

  // Check if field is a skill
  if (Skills.includes(field as SkillType)) {
    const char = await computeCharacter(db, characterId);
    if (!char) {
      return c.html(<>
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Character not found</div>
        </div>
      </>);
    }

    const skill = field as SkillType;
    const skillScore = char.skills[skill];
    const ability = SkillAbilities[skill];
    const abilityAbbr = ability.slice(0, 3).toUpperCase();
    const values = {
      proficiency: skillScore.proficiency,
    };

    return c.html(<SkillEditForm
      characterId={characterId}
      skill={skill}
      abilityAbbr={abilityAbbr}
      currentModifier={skillScore.modifier}
      currentProficiency={skillScore.proficiency}
      values={values}
    />);
  }

  return c.html(<>
    <div class="modal-header">
      <h5 class="modal-title">Edit {field}</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      Coming soon
    </div>
  </>)
})

characterRoutes.post('/characters/:id/edit/:field/check', async (c) => {
  const characterId = c.req.param('id') as string;
  const field = c.req.param('field') as string;
  const body = await c.req.parseBody() as Record<string, string>;

  // Check if field is an ability
  if (Abilities.includes(field as AbilityType)) {
    const char = await computeCharacter(db, characterId);
    if (!char) {
      return c.html(<>
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Character not found</div>
        </div>
      </>);
    }

    const ability = field as AbilityType;
    const abilityScore = char.abilityScores[ability];
    const { values, errors } = prepareUpdateAbilityForm(body, abilityScore.score, abilityScore.proficient);

    return c.html(<AbilityEditForm
      characterId={characterId}
      ability={ability}
      currentScore={abilityScore.score}
      currentModifier={abilityScore.modifier}
      isProficient={abilityScore.proficient}
      proficiencyBonus={char.proficiencyBonus}
      values={values}
      errors={Object.keys(errors).length > 0 ? errors : undefined}
    />);
  }

  // Check if field is a skill
  if (Skills.includes(field as SkillType)) {
    const char = await computeCharacter(db, characterId);
    if (!char) {
      return c.html(<>
        <div class="modal-header">
          <h5 class="modal-title">Error</h5>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <div class="alert alert-danger">Character not found</div>
        </div>
      </>);
    }

    const skill = field as SkillType;
    const skillScore = char.skills[skill];
    const ability = SkillAbilities[skill];
    const abilityAbbr = ability.slice(0, 3).toUpperCase();
    const { values, errors } = prepareUpdateSkillForm(body, skillScore.proficiency);

    // Calculate new modifier for preview
    const calculateModifier = (score: number) => Math.floor((score - 10) / 2);
    const abilityModifier = char.abilityScores[ability].modifier;
    let newModifier: number | undefined = undefined;

    if (values.proficiency && values.proficiency !== skillScore.proficiency) {
      const proficiency = values.proficiency as any;
      switch (proficiency) {
        case 'none':
          newModifier = abilityModifier;
          break;
        case 'half':
          newModifier = abilityModifier + Math.floor(char.proficiencyBonus / 2);
          break;
        case 'proficient':
          newModifier = abilityModifier + char.proficiencyBonus;
          break;
        case 'expert':
          newModifier = abilityModifier + (char.proficiencyBonus * 2);
          break;
      }
    }

    return c.html(<SkillEditForm
      characterId={characterId}
      skill={skill}
      abilityAbbr={abilityAbbr}
      currentModifier={skillScore.modifier}
      currentProficiency={skillScore.proficiency}
      newModifier={newModifier}
      values={values}
      errors={Object.keys(errors).length > 0 ? errors : undefined}
    />);
  }

  // Not found
  return c.html(<>
    <div class="modal-header">
      <h5 class="modal-title">Error</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <div class="alert alert-danger">Unknown field: {field}</div>
    </div>
  </>);
})

characterRoutes.post('/characters/:id/edit/:field', async (c) => {
  const characterId = c.req.param('id') as string;
  const char = await computeCharacter(db, characterId);
  if (!char) {
    await setFlashMsg(c, 'Character not found', 'error');
    c.header('HX-Redirect', `/characters`);
    return c.body(null, 204);
  }


  const field = c.req.param('field') as string;
  const body = await c.req.parseBody() as Record<string, string>;

  // Check if field is an ability
  if (Abilities.includes(field as AbilityType)) {
    const ability = field as AbilityType;
    const abilityScore = char.abilityScores[ability];

    // Strict validation (no mutation)
    const validation = validateUpdateAbility(body, abilityScore.score, abilityScore.proficient);

    if (!validation.valid) {
      return c.html(<AbilityEditForm
        characterId={characterId}
        ability={ability}
        currentScore={abilityScore.score}
        currentModifier={abilityScore.modifier}
        isProficient={abilityScore.proficient}
        proficiencyBonus={char.proficiencyBonus}
        values={body}
        errors={validation.errors}
      />);
    }

    // Parse with Zod
    const result = UpdateAbilityApiSchema.safeParse({
      character_id: characterId,
      ability: ability,
      score: parseInt(body.score || ''),
      proficiency_change: body.proficiency_change,
      note: body.note || null,
    });

    if (!result.success) {
      const errors = zodToFormErrors(result.error);
      return c.html(<AbilityEditForm
        characterId={characterId}
        ability={ability}
        currentScore={abilityScore.score}
        currentModifier={abilityScore.modifier}
        isProficient={abilityScore.proficient}
        proficiencyBonus={char.proficiencyBonus}
        values={body}
        errors={errors}
      />);
    }

    try {
      await updateAbility(db, result.data, abilityScore.proficient);

    } catch (error) {
      console.error("updating ability", error);
      return c.html(<AbilityEditForm
        characterId={characterId}
        ability={ability}
        currentScore={abilityScore.score}
        currentModifier={abilityScore.modifier}
        isProficient={abilityScore.proficient}
        proficiencyBonus={char.proficiencyBonus}
        values={body}
        errors={{ score: 'Failed to update ability' }}
      />);
    }

    const updatedChar = (await computeCharacter(db, characterId))!;
    c.header('HX-Trigger', 'closeEditModal');
    return c.html(<>
      <AbilitiesPanel character={updatedChar} swapOob={true} />
      <CharacterInfo character={updatedChar} swapOob={true} />
      <SkillsPanel character={updatedChar} swapOob={true} />
      <SpellsPanel character={updatedChar} swapOob={true} />
    </>)
  }

  // Check if field is a skill
  else if (Skills.includes(field as SkillType)) {
    const skill = field as SkillType;
    const skillScore = char.skills[skill];
    const ability = SkillAbilities[skill];
    const abilityAbbr = ability.slice(0, 3).toUpperCase();

    // Strict validation (no mutation)
    const validation = validateUpdateSkill(body, skillScore.proficiency);

    if (!validation.valid) {
      return c.html(<SkillEditForm
        characterId={characterId}
        skill={skill}
        abilityAbbr={abilityAbbr}
        currentModifier={skillScore.modifier}
        currentProficiency={skillScore.proficiency}
        values={body}
        errors={validation.errors}
      />);
    }

    // Parse with Zod
    const result = UpdateSkillApiSchema.safeParse({
      character_id: characterId,
      skill: skill,
      proficiency: body.proficiency,
      note: body.note || null,
    });

    if (!result.success) {
      const errors = zodToFormErrors(result.error);
      return c.html(<SkillEditForm
        characterId={characterId}
        skill={skill}
        abilityAbbr={abilityAbbr}
        currentModifier={skillScore.modifier}
        currentProficiency={skillScore.proficiency}
        values={body}
        errors={errors}
      />);
    }

    try {
      await updateSkill(db, result.data);
    } catch (error) {
      console.error("updating skill", error);
      return c.html(<SkillEditForm
        characterId={characterId}
        skill={skill}
        abilityAbbr={abilityAbbr}
        currentModifier={skillScore.modifier}
        currentProficiency={skillScore.proficiency}
        values={body}
        errors={{ proficiency: 'Failed to update skill' }}
      />);
    }

    const updatedChar = (await computeCharacter(db, characterId))!;
    c.header('HX-Trigger', 'closeEditModal');
    return c.html(<>
      <SkillsPanel character={updatedChar} swapOob={true} />
      <CharacterInfo character={updatedChar} swapOob={true} />
    </>)
  }

  // Not found
  return c.html(<>
    <div class="modal-header">
      <h5 class="modal-title">Error</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      <div class="alert alert-danger">Unknown field: {field}</div>
    </div>
  </>);
})

characterRoutes.get('/characters/:id/history/:field', async (c) => {
  const characterId = c.req.param('id') as string;
  const field = c.req.param('field') as string;

  if (field === 'class') {
    const levels = await findByCharacterId(db, characterId);
    // Reverse to show most recent first
    levels.reverse();
    return c.html(<ClassHistory levels={levels} />);
  }

  if (field === 'hitpoints') {
    // Fetch both HP changes and level-ups
    const hpChanges = await findHPChanges(db, characterId);
    const levels = await findByCharacterId(db, characterId);

    // Merge into unified events
    const events: HPHistoryEvent[] = [];

    // Add HP delta events
    for (const hp of hpChanges) {
      events.push({
        date: hp.created_at,
        type: 'delta',
        delta: hp.delta,
        note: hp.note || undefined,
      });
    }

    // Add level-up events (each grants max HP)
    for (const level of levels) {
      events.push({
        date: level.created_at,
        type: 'level',
        class: level.class,
        level: level.level,
        hitDieRoll: level.hit_die_roll,
        note: level.note || undefined,
      });
    }

    // Sort by date descending (most recent first)
    events.sort((a, b) => b.date.getTime() - a.date.getTime());

    return c.html(<HitPointsHistory events={events} />);
  }

  if (field === 'hitdice') {
    const hitDiceEvents = await findHitDiceChanges(db, characterId);
    // Reverse to show most recent first
    hitDiceEvents.reverse();
    return c.html(<HitDiceHistory events={hitDiceEvents} />);
  }

  if (field === 'spellslots') {
    const spellSlotEvents = await findSpellSlotChanges(db, characterId);
    // Reverse to show most recent first
    spellSlotEvents.reverse();
    return c.html(<SpellSlotsHistory events={spellSlotEvents} />);
  }

  if (field === 'prepared-spells') {
    const preparedSpellEvents = await findPreparedSpellChanges(db, characterId);
    // Reverse to show most recent first
    preparedSpellEvents.reverse();
    return c.html(<PreparedSpellsHistory events={preparedSpellEvents} />);
  }

  if (field === 'spellbook') {
    const spellbookEvents = await findLearnedSpellChanges(db, characterId);
    // Reverse to show most recent first
    spellbookEvents.reverse();
    return c.html(<SpellbookHistory events={spellbookEvents} />);
  }

  // Check if field is an ability
  if (Abilities.includes(field as AbilityType)) {
    const abilityEvents = await findAbilityChanges(db, characterId);
    // Filter to only this ability and reverse to show most recent first
    const filteredEvents = abilityEvents
      .filter(event => event.ability === field)
      .reverse();
    return c.html(<AbilityHistory ability={field} events={filteredEvents} />);
  }

  // Check if field is a skill
  if (Skills.includes(field as SkillType)) {
    const skillEvents = await findSkillChanges(db, characterId);
    // Filter to only this skill and reverse to show most recent first
    const filteredEvents = skillEvents
      .filter(event => event.skill === field)
      .reverse();
    return c.html(<SkillHistory skill={field} events={filteredEvents} />);
  }

  return c.html(<>
    <div class="modal-header">
      <h5 class="modal-title">{field} history</h5>
      <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
    </div>
    <div class="modal-body">
      Coming soon
    </div>
  </>)
})
