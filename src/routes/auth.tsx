import { Hono } from 'hono'
import { create, findByEmail } from '@src/db/users'
import { setAuthCookie, clearAuthCookie } from '@src/middleware/auth'
import { Login } from '@src/components/Login'

export const authRoutes = new Hono()

authRoutes.get('/login', (c) => {
  return c.render(<Login />, { title: "Login" })
})

authRoutes.post('/login', async (c) => {
  const formData = await c.req.formData()
  const email = formData.get("email") as string

  if (!email) {
    return c.text("Email is required", 400)
  }

  if (typeof email !== "string" || !email.includes("@")) {
    return c.text("Invalid email", 400)
  }

  let user = await findByEmail(email)

  if (!user) {
    user = await create(email)
  }

  await setAuthCookie(c, user.id)
  return c.redirect('/');
})

authRoutes.get('/logout', (c) => {
  clearAuthCookie(c);
  return c.redirect('/');
})
