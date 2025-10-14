import type { Context } from "hono"
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie"
import { createMiddleware } from "hono/factory"
import { config } from "../config"
import { db } from "../db"
import type { User } from "../db/users"
import { findById } from "../db/users"
import { setFlashMsg } from "./flash"

export interface AuthVariables {
  user?: User
}

const AUTH_COOKIE_NAME = "user_id" as const

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const userId = await getSignedCookie(c, config.cookieSecret, AUTH_COOKIE_NAME)

  if (!userId) {
    await next()
    return
  }

  try {
    const user = await findById(db, userId)
    if (user && user.id === userId) {
      c.set("user", user)
    }
  } catch (error) {
    console.error("Auth middleware error:", error)
  }

  await next()
})

export async function setAuthCookie(c: Context, userId: string) {
  await setSignedCookie(c, AUTH_COOKIE_NAME, userId, config.cookieSecret, {
    httpOnly: true,
    sameSite: "Strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production",
  })
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
