import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import { indexRoutes } from './routes/index'

const app = new Hono()

// Serve static files
app.use('/static/*', serveStatic({ root: './' }))
app.use('/favicon.ico', serveStatic({ path: './static/favicon.ico' }))

// Routes
app.route('/', indexRoutes)

export default app
