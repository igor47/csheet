import { Campaigns } from "@src/components/Campaigns"
import { getDb } from "@src/db"
import { listCampaigns } from "@src/services/campaigns/list"
import { Hono } from "hono"

export const campaignsRoutes = new Hono()

campaignsRoutes.get("/campaigns", async (c) => {
  const user = c.var.user!

  const campaigns = await listCampaigns(getDb(c), user.id)

  return c.render(<Campaigns campaigns={campaigns} />, {
    title: "My Campaigns",
  })
})
