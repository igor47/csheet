import { Hono } from 'hono'
import { Character } from '@src/components/Character'
import { CharacterNew } from '@src/components/CharacterNew'
import { Characters } from '@src/components/Characters'
import { ClassEditForm } from '@src/components/ClassEditForm'
import { ClassHistory } from '@src/components/ClassHistory'
import { findByUserId, nameExistsForUser } from '@src/db/characters'
import { getCurrentLevels, maxClassLevel, findByCharacterId } from '@src/db/char_levels'
import { createCharacter, CreateCharacterApiSchema } from '@src/services/createCharacter'
import { computeCharacter } from '@src/services/computeCharacter'
import { addLevel, AddLevelApiSchema, prepareAddLevelForm, validateAddLevel } from '@src/services/addLevel'
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

characterRoutes.get('/characters/:id/history/:field', async (c) => {
  const characterId = c.req.param('id') as string;
  const field = c.req.param('field') as string;

  if (field === 'class') {
    const levels = await findByCharacterId(db, characterId);
    return c.html(<ClassHistory levels={levels} />);
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
