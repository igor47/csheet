import { Login } from "@src/components/Login"
import { getDb } from "@src/db"
import { create, findByEmail } from "@src/db/users"
import { clearAuthCookie, setAuthCookie } from "@src/middleware/auth"
import { setFlashMsg } from "@src/middleware/flash"
import { Hono } from "hono"

export const authRoutes = new Hono()

authRoutes.get("/login", (c) => {
  const redirect = c.req.query("redirect")
  return c.render(<Login redirect={redirect} />, { title: "Login" })
})

authRoutes.post("/login", async (c) => {
  const formData = await c.req.formData()
  const email = formData.get("email") as string
  const redirect = formData.get("redirect") as string | null

  if (!email) {
    return c.text("Email is required", 400)
  }

  if (typeof email !== "string" || !email.includes("@")) {
    return c.text("Invalid email", 400)
  }

  let user = await findByEmail(getDb(c), email)

  if (!user) {
    user = await create(getDb(c), email)
    await setFlashMsg(c, "Account created. You are now logged in.", "info")
  } else {
    await setFlashMsg(c, "Logged in successfully.", "success")
  }

  await setAuthCookie(c, user.id)
  return c.redirect(redirect || "/characters")
})

authRoutes.get("/logout", async (c) => {
  clearAuthCookie(c)
  await setFlashMsg(c, "You have been logged out.", "warning")
  return c.redirect("/")
})
