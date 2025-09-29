import { Hono } from 'hono'
import { Welcome } from '@src/components/Welcome'

export const indexRoutes = new Hono()

indexRoutes.get('/', (c) => {
  return c.render(<Welcome user={c.var.user} />, { title: "Welcome to CSheet" })
})
