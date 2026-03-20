import { FirstLoginWelcome } from "@src/components/FirstLoginWelcome"
import { getDb } from "@src/db"
import { markWelcomed, update } from "@src/db/users"
import { Hono } from "hono"

export const welcomeRoutes = new Hono()

welcomeRoutes.get("/welcome", (c) => {
  const redirect = c.req.query("redirect")
  return c.render(<FirstLoginWelcome redirect={redirect} />, { title: "Welcome to CSheet" })
})

welcomeRoutes.post("/welcome", async (c) => {
  const user = c.var.user!
  const formData = await c.req.formData()
  const marketingOptIn = formData.get("marketing_opt_in") === "on"
  const redirect = formData.get("redirect") as string | null

  const db = getDb(c)
  await update(db, user.id, { name: user.name, marketing_opt_in: marketingOptIn })
  await markWelcomed(db, user.id)

  return c.redirect(redirect || "/characters")
})
