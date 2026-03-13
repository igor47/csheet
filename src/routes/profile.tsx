import { Profile } from "@src/components/Profile"
import { getDb } from "@src/db"
import { setFlashMsg } from "@src/middleware/flash"
import { updateProfile } from "@src/services/updateProfile"
import { Hono } from "hono"

export const profileRoutes = new Hono()

profileRoutes.get("/profile", (c) => {
  const user = c.var.user!
  return c.render(<Profile user={user} />, { title: "Profile" })
})

profileRoutes.post("/profile", async (c) => {
  const user = c.var.user!
  const body = (await c.req.parseBody()) as Record<string, string>

  const result = await updateProfile(getDb(c), user, body)

  if (!result.complete) {
    return c.html(<Profile user={user} values={result.values} errors={result.errors} />)
  }

  await setFlashMsg(c, "Profile updated successfully!", "success")
  c.header("HX-Redirect", "/profile")
  return c.body(null, 204)
})
