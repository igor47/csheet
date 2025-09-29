import { Hono } from 'hono'
import { indexRoutes } from './routes/index'
import { authRoutes } from './routes/auth'
import { characterRoutes } from './routes/character'
import { jsxRenderer } from 'hono/jsx-renderer'
import { Layout } from './components/Layout'
import { applyMiddleware } from './middleware'
import { cachingServeStatic } from './middleware/cachingServeStatic'

const app = new Hono()

// jsx renderer
// use the layout for all routes
app.use(jsxRenderer((props, c) => {
  const user = c.get('user')
  const currentPage = c.req.path
  return Layout({ ...props, user, currentPage })
}))

// update typescript to indicate the title prop on the layout
// see: https://hono.dev/docs/api/context#render-setrenderer
declare module 'hono' {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      head: { title: string }
    ): Response | Promise<Response>
  }
}

// middleware
applyMiddleware(app);

// Serve static files
app.use('/static/*', cachingServeStatic({ root: './' }))
app.use('/favicon.ico', cachingServeStatic({ path: './static/favicon.ico' }))

// Routes
app.route('/', indexRoutes)
app.route('/', authRoutes)
app.route('/', characterRoutes)

export default app
