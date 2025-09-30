import { Hono } from 'hono'
import { create, findByEmail } from '@src/db/users'
import { setAuthCookie, clearAuthCookie } from '@src/middleware/auth'
import { Login } from '@src/components/Login'
import { setFlashMsg } from '@src/middleware/flash'

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
    await setFlashMsg(c, 'Account created. You are now logged in.', 'info')
  } else {
    await setFlashMsg(c, 'Logged in successfully.', 'success')
  }

  await setAuthCookie(c, user.id)
  return c.redirect('/characters');
})

authRoutes.get('/logout', async (c) => {
  clearAuthCookie(c);
  await setFlashMsg(c, 'You have been logged out.', 'warning');
  return c.redirect('/');
})
