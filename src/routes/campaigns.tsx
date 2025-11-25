import { Campaign } from "@src/components/Campaign"
import { CampaignNew } from "@src/components/CampaignNew"
import { Campaigns } from "@src/components/Campaigns"
import { getDb } from "@src/db"
import { setFlashMsg } from "@src/middleware/flash"
import { authorizeCampaign, handleCampaignUnallowed } from "@src/services/campaigns/authorize"
import { createCampaign } from "@src/services/campaigns/create"
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

campaignsRoutes.get("/campaigns/new", (c) => {
  return c.render(<CampaignNew />, { title: "New Campaign" })
})

campaignsRoutes.post("/campaigns/new", async (c) => {
  const user = c.var.user!
  const body = (await c.req.parseBody()) as Record<string, string>

  const result = await createCampaign(getDb(c), user, body)

  if (!result.complete) {
    return c.html(<CampaignNew values={result.values} errors={result.errors} />)
  }

  await setFlashMsg(c, "Campaign created successfully!", "success")
  c.header("HX-Redirect", `/campaigns/${result.campaign.id}`)
  return c.body(null, 204)
})

campaignsRoutes.get("/campaigns/:id", async (c) => {
  const id = c.req.param("id") as string

  const authResult = await authorizeCampaign(c, id)
  if (!authResult.allowed) {
    return handleCampaignUnallowed(c, authResult.reason)
  }

  return c.render(<Campaign campaign={authResult.campaign} />, {
    title: authResult.campaign.name,
  })
})
