import { FirstLoginWelcome } from "@src/components/FirstLoginWelcome"
import { getDb } from "@src/db"
import { safeRedirect } from "@src/lib/url"
import { completeWelcome } from "@src/services/completeWelcome"
import { Hono } from "hono"

export const welcomeRoutes = new Hono()

welcomeRoutes.get("/welcome", (c) => {
  const redirect = c.req.query("redirect")
  const user = c.var.user
  return c.render(<FirstLoginWelcome redirect={redirect} name={user?.name} />, {
    title: "Welcome to CSheet",
  })
})

welcomeRoutes.post("/welcome", async (c) => {
  const user = c.var.user!
  const formData = await c.req.formData()
  const name = formData.get("name") as string | null
  const marketingOptIn = formData.get("marketing_opt_in") === "on"
  const redirect = formData.get("redirect") as string | null

  await completeWelcome(getDb(c), user, { name, marketingOptIn })

  return c.redirect(safeRedirect(redirect, "/characters"))
})
