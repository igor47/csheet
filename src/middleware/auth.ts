import { createMiddleware } from "hono/factory";
import { getSignedCookie, setSignedCookie, deleteCookie } from "hono/cookie";
import { findById } from "../db/users";
import { config } from "../config";

import type { Context } from "hono";
import type { User } from "../db/users";

export interface AuthVariables {
  user?: User;
}

const AUTH_COOKIE_NAME = "user_id" as const;

export const authMiddleware = createMiddleware<{ Variables: AuthVariables }>(async (c, next) => {
  const userId = await getSignedCookie(c, config.cookieSecret, AUTH_COOKIE_NAME);

  if (!userId) {
    await next();
    return;
  }

  try {
    const user = await findById(userId);
    if (user && user.id === userId) {
      c.set("user", user);
    }
  } catch (error) {
    console.error("Auth middleware error:", error);
  }

  await next();
});

export async function setAuthCookie(c: Context, userId: string) {
  await setSignedCookie(c, AUTH_COOKIE_NAME, userId, config.cookieSecret, {
    httpOnly: true,
    sameSite: "Strict",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: process.env.NODE_ENV === "production"
  });
}

export function clearAuthCookie(c: Context) {
  deleteCookie(c, AUTH_COOKIE_NAME);
}
