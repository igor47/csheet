import type { SQL } from "bun"
import { Hono } from "hono"
import { jsxRenderer } from "hono/jsx-renderer"
import { Layout } from "./components/Layout"
import { logger } from "./lib/logger"
import { applyMiddleware } from "./middleware"
import { requireAuth } from "./middleware/auth"
import { cachingServeStatic } from "./middleware/cachingServeStatic"
import { authRoutes } from "./routes/auth"
import { characterRoutes } from "./routes/character"
import { healthRoutes } from "./routes/health"
import { indexRoutes } from "./routes/index"
import { spellsRoutes } from "./routes/spells"
import { uploadsRoutes } from "./routes/uploads"

// update typescript to indicate the title prop on the layout
// see: https://hono.dev/docs/api/context#render-setrenderer
// biome-ignore-start lint/style/useShorthandFunctionType: this is how the hono docs show it
declare module "hono" {
  interface ContextRenderer {
    (
      content: string | Promise<string>,
      props: { title: string; description?: string; ogImage?: string; ogUrl?: string }
    ): Response
  }
}
// biome-ignore-end lint/style/useShorthandFunctionType: this is how the hono docs show it

export function createApp(db?: SQL) {
  const app = new Hono()

  // Inject database first if provided (for tests)
  // This MUST run before all other middleware so it's available to auth
  if (db) {
    app.use("*", (c, next) => {
      c.set("db", db)
      return next()
    })
  }

  // Health checks (no middleware, no auth, no logging)
  app.route("/", healthRoutes)

  // jsx renderer
  // use the layout for all routes
  app.use(
    jsxRenderer((props, c) => {
      const user = c.get("user")
      const currentPage = c.req.path
      const flash = c.get("flash")
      return Layout({ ...props, user, currentPage, flash })
    })
  )

  // middleware
  applyMiddleware(app)

  // Serve static files
  app.use("/static/*", cachingServeStatic({ root: "./" }))
  app.use("/favicon.ico", cachingServeStatic({ path: "./static/favicon.ico" }))

  // Public routes (no auth required)
  app.route("/", indexRoutes)
  app.route("/", authRoutes)
  app.route("/", spellsRoutes)

  // Protected routes (auth required)
  const protectedRoutes = new Hono()
  protectedRoutes.use("*", requireAuth)
  protectedRoutes.route("/", characterRoutes)
  protectedRoutes.route("/", uploadsRoutes)

  app.route("/", protectedRoutes)

  // Error handler
  app.onError((err, c) => {
    logger.error("Unhandled error", err, { path: c.req.path })
    return c.text("Internal Server Error", 500)
  })

  return app
}
