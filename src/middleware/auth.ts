import type { SQL } from "bun"
import type { Context } from "hono"
import { deleteCookie, generateSignedCookie, getSignedCookie } from "hono/cookie"
import { createMiddleware } from "hono/factory"
import { config } from "../config"
import { getDb } from "../db"
import type { User } from "../db/users"
import { findById } from "../db/users"
import { setFlashMsg } from "./flash"

export interface AuthVariables {
  user?: User
  db?: SQL
}

const AUTH_COOKIE_NAME = "user_id" as const

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const userId = await getSignedCookie(c, config.cookieSecret, AUTH_COOKIE_NAME)

  if (!userId) {
    await next()
    return
  }

  try {
    const user = await findById(getDb(c), userId)
    if (user && user.id === userId) {
      c.set("user", user)
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
  }

  await next()
})

export async function genAuthCookieValue(userId: string): Promise<string> {
  return await generateSignedCookie(AUTH_COOKIE_NAME, userId, config.cookieSecret, {
    httpOnly: true,
    sameSite: "Strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  })
}

export async function setAuthCookie(c: Context, userId: string) {
  const cookieValue = await genAuthCookieValue(userId)
  c.res.headers.append("Set-Cookie", cookieValue)
}

export function clearAuthCookie(c: Context) {
  deleteCookie(c, AUTH_COOKIE_NAME)
}

export const requireAuth = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const user = c.get("user")
  if (!user) {
    await setFlashMsg(c, "Please log in to continue.", "warning")
    const redirectTo = encodeURIComponent(c.req.path)
    return c.redirect(`/login?redirect=${redirectTo}`)
  }
  await next()
})
