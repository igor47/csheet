import { Hono } from 'hono'
import { Character } from '@src/components/Character'
import { CharacterNew } from '@src/components/CharacterNew'
import { Characters } from '@src/components/Characters'
import { findByUserId, nameExistsForUser } from '@src/db/characters'
import { createCharacter, CreateCharacterApiSchema } from '@src/services/createCharacter'
import { computeCharacter } from '@src/services/computeCharacter'
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
