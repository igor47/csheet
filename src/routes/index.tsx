import { Welcome } from "@src/components/Welcome"
import { Hono } from "hono"

export const indexRoutes = new Hono()

indexRoutes.get("/", (c) => {
  return c.render(<Welcome user={c.var.user} />, {
    title: "CSheet - Open Source D&D Character Sheet",
    description:
      "Open-source, self-hostable D&D 5e character sheet supporting both 2014 (SRD 5.1) and 2024 (SRD 5.2) rulesets. Not a virtual tabletop - designed as a companion for your in-person game.",
    ogUrl: "https://www.csheet.net",
  })
})
