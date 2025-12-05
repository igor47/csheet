import { AddCharacterToCampaign } from "@src/components/AddCharacterToCampaign"
import { Campaign } from "@src/components/Campaign"
import { CampaignInviteForm } from "@src/components/CampaignInviteForm"
import { CampaignNew } from "@src/components/CampaignNew"
import { Campaigns } from "@src/components/Campaigns"
import { getDb } from "@src/db"
import { countArchivedByUserId } from "@src/db/campaigns"
import { getBaseUrl } from "@src/lib/url"
import { setFlashMsg } from "@src/middleware/flash"
import { addCharacterToCampaign } from "@src/services/campaigns/addCharacter"
import { archiveCampaign } from "@src/services/campaigns/archive"
import { authorizeCampaign, handleCampaignUnallowed } from "@src/services/campaigns/authorize"
import { createCampaign } from "@src/services/campaigns/create"
import { deleteInvite } from "@src/services/campaigns/deleteInvite"
import { createInvite } from "@src/services/campaigns/invite"
import { listCampaigns } from "@src/services/campaigns/list"
import { respondToInvite } from "@src/services/campaigns/respond"
import { unarchiveCampaign } from "@src/services/campaigns/unarchive"
import { listCharacters } from "@src/services/listCharacters"
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

// Invite modal content (GET returns form)
campaignsRoutes.get("/campaigns/:id/invite", async (c) => {
  const id = c.req.param("id") as string

  const authResult = await authorizeCampaign(c, id)
  if (!authResult.allowed) {
    return handleCampaignUnallowed(c, authResult.reason)
  }

  // Only DMs can invite
  if (authResult.role !== "dm") {
    await setFlashMsg(c, "Only DMs can invite members", "error")
    c.header("HX-Redirect", `/campaigns/${id}`)
    return c.body(null, 403)
  }

  return c.html(<CampaignInviteForm campaignId={id} />)
})

// Send invite (POST)
campaignsRoutes.post("/campaigns/:id/invite", async (c) => {
  const id = c.req.param("id") as string
  const user = c.var.user!

  const authResult = await authorizeCampaign(c, id)
  if (!authResult.allowed) {
    return handleCampaignUnallowed(c, authResult.reason)
  }

  // Only DMs can invite
  if (authResult.role !== "dm") {
    await setFlashMsg(c, "Only DMs can invite members", "error")
    c.header("HX-Redirect", `/campaigns/${id}`)
    return c.body(null, 403)
  }

  const body = (await c.req.parseBody()) as Record<string, string>

  const result = await createInvite(getDb(c), authResult.campaign, user, {
    ...body,
    baseUrl: getBaseUrl(c),
  })

  // Validation failed - re-render form with values and errors
  if (!result.complete) {
    return c.html(
      <CampaignInviteForm campaignId={id} values={result.values} errors={result.errors} />
    )
  }

  // Success - close the modal and set flash message
  // The user can see the new pending member when they refresh or navigate to the campaign
  await setFlashMsg(c, `Invitation sent to ${body.email}`, "success")
  c.header("HX-Trigger", "closeModal")
  c.header("HX-Refresh", "true")
  return c.body(null, 204)
})

// Accept invite from campaigns list (already logged in)
// Note: Cannot use authorizeCampaign here because pending invites have accepted_at=null,
// so getUserRole() returns null and the user would be treated as "not_member".
// The respondToInvite service handles membership lookup directly.
campaignsRoutes.post("/campaigns/:id/accept", async (c) => {
  const id = c.req.param("id") as string
  const user = c.var.user!

  const result = await respondToInvite(getDb(c), id, user, "accept")

  if (!result.complete) {
    await setFlashMsg(c, result.errors._form || "Failed to accept invitation", "error")
    c.header("HX-Redirect", "/campaigns")
    return c.body(null, 400)
  }

  await setFlashMsg(c, "Welcome to the campaign!", "success")
  c.header("HX-Redirect", `/campaigns/${id}`)
  return c.body(null, 200)
})

// Decline invite from campaigns list
// Note: Same as accept - cannot use authorizeCampaign for pending invites.
campaignsRoutes.post("/campaigns/:id/decline", async (c) => {
  const id = c.req.param("id") as string
  const user = c.var.user!

  const result = await respondToInvite(getDb(c), id, user, "decline")

  if (!result.complete) {
    await setFlashMsg(c, result.errors._form || "Failed to decline invitation", "error")
    c.header("HX-Redirect", "/campaigns")
    return c.body(null, 400)
  }

  await setFlashMsg(c, "Invitation declined", "info")
  c.header("HX-Redirect", "/campaigns")
  return c.body(null, 200)
})

// Delete invite (DM only) - for pending or declined invites
campaignsRoutes.delete("/campaigns/:id/members/:memberId", async (c) => {
  const id = c.req.param("id") as string
  const memberId = c.req.param("memberId") as string

  const authResult = await authorizeCampaign(c, id)
  if (!authResult.allowed) {
    return handleCampaignUnallowed(c, authResult.reason)
  }

  // Only DMs can delete invites
  if (authResult.role !== "dm") {
    await setFlashMsg(c, "Only DMs can delete invitations", "error")
    c.header("HX-Redirect", `/campaigns/${id}`)
    return c.body(null, 403)
  }

  const result = await deleteInvite(getDb(c), id, memberId)

  if (!result.complete) {
    await setFlashMsg(c, result.errors._form || "Failed to delete invitation", "error")
    c.header("HX-Redirect", `/campaigns/${id}`)
    return c.body(null, 400)
  }

  await setFlashMsg(c, "Invitation deleted", "success")
  c.header("HX-Refresh", "true")
  return c.body(null, 204)
})

// Add character to campaign - show modal with user's characters
campaignsRoutes.get("/campaigns/:id/add-character", async (c) => {
  const id = c.req.param("id") as string
  const user = c.var.user!

  const authResult = await authorizeCampaign(c, id)
  if (!authResult.allowed) {
    return handleCampaignUnallowed(c, authResult.reason)
  }

  // Get user's characters not already in this campaign
  const userCharacters = await listCharacters(getDb(c), { userId: user.id })
  const campaignCharIds = new Set(authResult.campaign.characters.map((cc) => cc.character_id))
  const availableCharacters = userCharacters.filter((ch) => !campaignCharIds.has(ch.id))

  return c.html(<AddCharacterToCampaign campaignId={id} characters={availableCharacters} />)
})

// Add character to campaign - POST
campaignsRoutes.post("/campaigns/:id/characters/:characterId", async (c) => {
  const id = c.req.param("id") as string
  const characterId = c.req.param("characterId") as string
  const user = c.var.user!

  const authResult = await authorizeCampaign(c, id)
  if (!authResult.allowed) {
    return handleCampaignUnallowed(c, authResult.reason)
  }

  const result = await addCharacterToCampaign(getDb(c), authResult.campaign, characterId, user.id)

  if (!result.complete) {
    // Re-render modal with error
    const userCharacters = await listCharacters(getDb(c), { userId: user.id })
    const campaignCharIds = new Set(authResult.campaign.characters.map((cc) => cc.character_id))
    const availableCharacters = userCharacters.filter((ch) => !campaignCharIds.has(ch.id))

    return c.html(
      <AddCharacterToCampaign
        campaignId={id}
        characters={availableCharacters}
        errors={result.errors}
      />
    )
  }

  await setFlashMsg(c, "Character added to campaign!", "success")
  c.header("HX-Trigger", "closeModal")
  c.header("HX-Refresh", "true")
  return c.body(null, 204)
})
