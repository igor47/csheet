import { Campaign } from "@src/components/Campaign"
import { CampaignNew } from "@src/components/CampaignNew"
import { Campaigns } from "@src/components/Campaigns"
import { getDb } from "@src/db"
import { countArchivedByUserId } from "@src/db/campaigns"
import { setFlashMsg } from "@src/middleware/flash"
import { archiveCampaign } from "@src/services/campaigns/archive"
import { authorizeCampaign, handleCampaignUnallowed } from "@src/services/campaigns/authorize"
import { createCampaign } from "@src/services/campaigns/create"
import { listCampaigns } from "@src/services/campaigns/list"
import { unarchiveCampaign } from "@src/services/campaigns/unarchive"
import { Hono } from "hono"

export const campaignsRoutes = new Hono()

campaignsRoutes.get("/campaigns", async (c) => {
  const user = c.var.user!
  const showArchived = c.req.query("show_archived") === "true"

  const campaigns = await listCampaigns(getDb(c), {
    userId: user.id,
    includeArchived: showArchived,
  })
  const archivedCount = await countArchivedByUserId(getDb(c), user.id)

  return c.render(
    <Campaigns campaigns={campaigns} showArchived={showArchived} archivedCount={archivedCount} />,
    { title: "My Campaigns" }
  )
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

campaignsRoutes.post("/campaigns/:id/archive", async (c) => {
  const id = c.req.param("id") as string

  const authResult = await authorizeCampaign(c, id)
  if (!authResult.allowed) {
    return handleCampaignUnallowed(c, authResult.reason)
  }

  // Only DMs can archive campaigns
  if (authResult.role !== "dm") {
    await setFlashMsg(c, "Only DMs can archive campaigns", "error")
    c.header("HX-Redirect", `/campaigns/${id}`)
    return c.body(null, 403)
  }

  const result = await archiveCampaign(getDb(c), authResult.campaign)
  if (!result.complete) {
    await setFlashMsg(c, result.errors._form || "Failed to archive campaign", "error")
    c.header("HX-Redirect", `/campaigns/${id}`)
    return c.body(null, 400)
  }

  await setFlashMsg(c, `Campaign "${authResult.campaign.name}" has been archived`, "success")
  c.header("HX-Redirect", "/campaigns?show_archived=true")
  return c.body(null, 204)
})

campaignsRoutes.post("/campaigns/:id/unarchive", async (c) => {
  const id = c.req.param("id") as string

  const authResult = await authorizeCampaign(c, id)
  if (!authResult.allowed) {
    return handleCampaignUnallowed(c, authResult.reason)
  }

  // Only DMs can unarchive campaigns
  if (authResult.role !== "dm") {
    await setFlashMsg(c, "Only DMs can unarchive campaigns", "error")
    c.header("HX-Redirect", `/campaigns/${id}`)
    return c.body(null, 403)
  }

  const result = await unarchiveCampaign(getDb(c), authResult.campaign)
  if (!result.complete) {
    await setFlashMsg(c, result.errors._form || "Failed to unarchive campaign", "error")
    c.header("HX-Redirect", "/campaigns?show_archived=true")
    return c.body(null, 400)
  }

  await setFlashMsg(c, `Campaign "${authResult.campaign.name}" has been restored`, "success")
  c.header("HX-Redirect", "/campaigns")
  return c.body(null, 204)
})
