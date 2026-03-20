import { FirstLoginWelcome } from "@src/components/FirstLoginWelcome"
import { getDb } from "@src/db"
import { completeWelcome } from "@src/services/completeWelcome"
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

  await completeWelcome(getDb(c), user, marketingOptIn)

  return c.redirect(redirect || "/characters")
})
