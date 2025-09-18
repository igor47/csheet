import { Hono } from 'hono'

export const indexRoutes = new Hono()

indexRoutes.get('/', (c) => {
  return c.render(
    <>
      <h1>Welcome to CSheet</h1>
      <a href="/sheets">View Sheets</a>
    </>,
    { title: 'Home' }
  )
})
