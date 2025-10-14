import { Welcome } from "@src/components/Welcome"
import { Hono } from "hono"

export const indexRoutes = new Hono()

indexRoutes.get("/", (c) => {
  return c.render(<Welcome user={c.var.user} />, { title: "Welcome to CSheet" })
})
