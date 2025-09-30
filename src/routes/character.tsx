import { Hono } from 'hono'
import { Character } from '@src/components/Character'
import { CharacterNew } from '@src/components/CharacterNew'
import { Characters } from '@src/components/Characters'
import { CharacterNameInput } from '@src/components/ui/CharacterNameInput'
import { findById, findByUserId, create, CreateCharacterSchema, nameExistsForUser } from '@src/db/characters'
import { z } from 'zod'
import { setFlashMsg } from '@src/middleware/flash'
import { zodToFormErrors } from '@src/lib/formErrors'

export const characterRoutes = new Hono()

characterRoutes.get('/characters', async (c) => {
  const user = c.var.user
  if (!user) {
    return c.redirect('/login')
  }

  const characters = await findByUserId(user.id)
  if (characters.length === 0) {
    await setFlashMsg(c, 'Create a character to get started!', 'info');
    return c.redirect('/characters/new');
  }

  return c.render(<Characters characters={characters} />, { title: "My Characters" })
})

characterRoutes.get('/characters/new', (c) => {
  const user = c.var.user
  if (!user) {
    return c.redirect('/login')
  }
  return c.render(<CharacterNew />, { title: "New Character" })
})

characterRoutes.post('/characters/new/name', async (c) => {
  const user = c.var.user
  if (!user) {
    return c.html(<CharacterNameInput error="Authentication required" />)
  }

  const body = await c.req.parseBody()
  const name = body.name as string

  if (!name || name.trim().length === 0) {
    return c.html(<CharacterNameInput error="Character name is required" value={name} />)
  }

  const exists = await nameExistsForUser(user.id, name)

  if (exists) {
    return c.html(<CharacterNameInput error="You already have a character with this name" value={name} />)
  }

  return c.html(<CharacterNameInput value={name} />)
})

characterRoutes.post('/characters/new', async (c) => {
  const user = c.var.user
  if (!user) {
    return c.redirect('/login')
  }

  const body = await c.req.parseBody() as Record<string, string>
  const values = {...body, user_id: user.id}

  const result = CreateCharacterSchema.safeParse(values)
  if (!result.success) {
    const errors = zodToFormErrors(result.error)
    return c.html(<CharacterNew values={values} errors={errors} />)
  }

  if (await nameExistsForUser(user.id, result.data.name)) {
    const errors = { name: "You already have a character with this name" }
    return c.html(<CharacterNew values={values} errors={errors} />)
  }

  const character = await create(result.data)

  await setFlashMsg(c, 'Character created successfully!', 'success');
  return c.redirect(`/characters/${character.id}`)
})

characterRoutes.get('/characters/:id', async (c) => {
  const id = c.req.param('id') as string;
  const char = await findById(id);
  if (!char) {
    return c.redirect('/characters');
  }

  return c.render(<Character character={char} />, { title: "Character Sheet" })
})
