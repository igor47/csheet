import { Hono } from 'hono'
import { Layout } from '../components/Layout'

export const indexRoutes = new Hono()

indexRoutes.get('/', (c) => {
  return c.html(
    <Layout>
      <h1>Welcome to CSheet</h1>
      <a href="/sheets">View Sheets</a>
    </Layout>
  )
})
