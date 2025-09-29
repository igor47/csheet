import { Hono } from 'hono'
import { Character } from '@src/components/Character'
import { CharacterNew } from '@src/components/CharacterNew'
import { Characters } from '@src/components/Characters'
import { findByUserId } from '@src/db/characters'

export const characterRoutes = new Hono()

characterRoutes.get('/character', async (c) => {
  const user = c.var.user
  if (!user) {
    return c.redirect('/login')
  }

  const characters = await findByUserId(user.id)
  return c.render(<Characters user={user} characters={characters} />, { title: "My Characters" })
})

characterRoutes.get('/character/new', (c) => {
  return c.render(<CharacterNew />, { title: "New Character" })
})

characterRoutes.get('/character/view', (c) => {
  return c.render(<Character />, { title: "Character Sheet" })
})
