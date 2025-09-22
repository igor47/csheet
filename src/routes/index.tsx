import { Hono } from 'hono'

import { Character } from '@src/components/Character';

export const indexRoutes = new Hono()

indexRoutes.get('/', (c) => {
  return c.render(<Character />, { title: "Character Sheet" });
})
