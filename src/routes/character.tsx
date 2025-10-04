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
import { findByUserId, nameExistsForUser } from '@src/db/characters'
import { getCurrentLevels, maxClassLevel, findByCharacterId } from '@src/db/char_levels'
import { findByCharacterId as findHPChanges } from '@src/db/char_hp'
import { findByCharacterId as findHitDiceChanges } from '@src/db/char_hit_dice'
import { createCharacter, CreateCharacterApiSchema } from '@src/services/createCharacter'
import { computeCharacter } from '@src/services/computeCharacter'
import { addLevel, AddLevelApiSchema, prepareAddLevelForm, validateAddLevel } from '@src/services/addLevel'
import { updateHitPoints, UpdateHitPointsApiSchema, prepareUpdateHitPointsForm, validateUpdateHitPoints } from '@src/services/updateHitPoints'
import { updateHitDice, UpdateHitDiceApiSchema, prepareUpdateHitDiceForm, validateUpdateHitDice } from '@src/services/updateHitDice'
import { setFlashMsg } from '@src/middleware/flash'
import { zodToFormErrors } from '@src/lib/formErrors'
import { db } from '@src/db'

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

characterRoutes.get('/characters/:id/edit/:field', async (c) => {
  const characterId = c.req.param('id') as string;
  const field = c.req.param('field') as string;

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
    await setFlashMsg(c, 'Level added successfully!', 'success');
    c.header('HX-Redirect', `/characters/${characterId}`);
    return c.body(null, 204);

  } catch (error) {
    console.error("adding level", error);
    await setFlashMsg(c, 'Failed to add level', 'error');
    return c.html(<ClassEditForm characterId={characterId} currentClassLevel={currentClassLevel} values={body} />);
  }
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

    // Recompute character with updated HP
    const updatedChar = await computeCharacter(db, characterId);
    if (!updatedChar) {
      return c.html(<HitPointsEditForm characterId={characterId} currentHP={char.currentHP} maxHitPoints={char.maxHitPoints} values={body} errors={{ amount: 'Failed to reload character' }} />);
    }

    // Trigger modal close
    c.header('HX-Trigger', 'closeEditModal');
    return c.html(<CharacterInfo character={updatedChar} />);
  } catch (error) {
    console.error("updating hit points", error);
    return c.html(<HitPointsEditForm characterId={characterId} currentHP={char.currentHP} maxHitPoints={char.maxHitPoints} values={body} errors={{ amount: 'Failed to update hit points' }} />);
  }
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

    // Recompute character with updated hit dice
    const updatedChar = await computeCharacter(db, characterId);
    if (!updatedChar) {
      return c.html(<HitDiceEditForm characterId={characterId} allHitDice={char.hitDice} availableHitDice={char.availableHitDice} values={body} errors={{ action: 'Failed to reload character' }} />);
    }

    // Trigger modal close
    c.header('HX-Trigger', 'closeEditModal');
    return c.html(<CharacterInfo character={updatedChar} />);

  } catch (error) {
    console.error("updating hit dice", error);
    return c.html(<HitDiceEditForm characterId={characterId} allHitDice={char.hitDice} availableHitDice={char.availableHitDice} values={body} errors={{ action: 'Failed to update hit dice' }} />);
  }
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
