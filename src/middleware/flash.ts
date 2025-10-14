import type { Context } from "hono"
import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie"
import { createMiddleware } from "hono/factory"
import { config } from "../config"

export interface Flash {
  msg: string
  level: "info" | "success" | "warning" | "error"
}

export interface FlashVariables {
  flash: Flash
}

const FLASH_COOKIE_NAME = "flash_msg" as const
const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "Strict",
  path: "/",
  maxAge: 60,
  secure: process.env.NODE_ENV === "production",
} as const

export const flashMiddleware = createMiddleware<{ Variables: FlashVariables }>(async (c, next) => {
  const flashStr = await getSignedCookie(c, config.cookieSecret, FLASH_COOKIE_NAME)
  if (!flashStr) {
    await next()
    return
  }

  try {
    const flashData = JSON.parse(flashStr) as Flash
    if (flashData) {
      c.set("flash", flashData)
    }
  } catch (error) {}

  deleteCookie(c, FLASH_COOKIE_NAME, COOKIE_OPTS)
  await next()
})

export async function setFlashMsg(c: Context, msg: Flash["msg"], level: Flash["level"] = "info") {
  const flash: Flash = { msg, level }
  await setSignedCookie(
    c,
    FLASH_COOKIE_NAME,
    JSON.stringify(flash),
    config.cookieSecret,
    COOKIE_OPTS
  )
}
