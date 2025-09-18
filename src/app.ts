import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { indexRoutes } from './routes/index'
import { jsxRenderer } from 'hono/jsx-renderer'
import { Layout } from './components/Layout'

const app = new Hono()

// jsx renderer
app.use(jsxRenderer(Layout))

// Serve static files
app.use('/static/*', serveStatic({ root: './' }))
app.use('/favicon.ico', serveStatic({ path: './static/favicon.ico' }))

// Routes
app.route('/', indexRoutes)

export default app
