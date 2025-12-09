import { Profile } from "@src/components/Profile"
import { getDb } from "@src/db"
import * as users from "@src/db/users"
import { Hono } from "hono"

export const profileRoutes = new Hono()

profileRoutes.get("/profile", (c) => {
  const user = c.var.user!
  return c.render(<Profile user={user} />, { title: "Profile" })
})

profileRoutes.post("/profile", async (c) => {
  const user = c.var.user!
  const formData = await c.req.formData()
  const name = (formData.get("name") as string)?.trim() || null

  const errors: Record<string, string> = {}

  // Validate name length if provided
  if (name && name.length > 100) {
    errors.name = "Name must be 100 characters or less"
  }

  // If validation errors, re-render form with errors
  if (Object.keys(errors).length > 0) {
    const values = { name: name || "" }
    return c.html(<Profile user={user} values={values} errors={errors} />)
  }

  // Update user
  const db = getDb(c)
  const updatedUser = await users.update(db, user.id, { name })

  if (!updatedUser) {
    return c.html(
      <Profile user={user} errors={{ general: "Failed to update profile. Please try again." }} />
    )
  }

  // Re-render form with success message
  return c.html(<Profile user={updatedUser} success />)
})
