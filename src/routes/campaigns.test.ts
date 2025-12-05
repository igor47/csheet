import { beforeEach, describe, expect, test } from "bun:test"
import type { Campaign } from "@src/db/campaigns"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { ulid } from "@src/lib/ids"
import { useTestApp } from "@src/test/app"
import {
  campaignCharacterFactory,
  campaignFactory,
  campaignMemberFactory,
} from "@src/test/factories/campaign"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("GET /campaigns", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/campaigns")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    describe("with no campaigns", () => {
      test("returns status 200 and shows empty state", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns", { user })

        expect(response.status).toBe(200)

        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain("You haven't created or joined any campaigns yet")
      })
    })

    describe("with a campaign", () => {
      let campaign: Campaign

      beforeEach(async () => {
        campaign = await campaignFactory.create({ created_by: user.id }, testCtx.db)
      })

      test("returns status 200", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns", { user })

        expect(response.status).toBe(200)
      })

      test("renders the campaigns list page", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns", { user })

        const document = await parseHtml(response)

        const title = expectElement(document, "title")
        expect(title.textContent).toContain("My Campaigns")
      })

      test("displays the campaign name", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns", { user })

        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain(campaign.name)
      })

      test("displays archive button for active campaign", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns", { user })

        const document = await parseHtml(response)
        const archiveButton = expectElement(document, `[data-testid="archive-${campaign.id}"]`)

        expect(archiveButton.getAttribute("hx-post")).toBe(`/campaigns/${campaign.id}/archive`)
      })
    })
  })
})

describe("GET /campaigns?show_archived=true", () => {
  const testCtx = useTestApp()

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    describe("with archived campaigns", () => {
      let campaign: Campaign

      beforeEach(async () => {
        campaign = await campaignFactory.create({ created_by: user.id }, testCtx.db)
        // Archive the campaign
        await testCtx.db`UPDATE campaigns SET archived_at = CURRENT_TIMESTAMP WHERE id = ${campaign.id}`
      })

      test("displays archived campaigns", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns?show_archived=true", { user })

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain(campaign.name)
        expect(body).toContain("Archived")
      })

      test("shows restore button", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns?show_archived=true", { user })

        const document = await parseHtml(response)
        const restoreButton = expectElement(document, `[data-testid="unarchive-${campaign.id}"]`)

        expect(restoreButton.getAttribute("hx-post")).toBe(`/campaigns/${campaign.id}/unarchive`)
        expect(restoreButton.getAttribute("title")).toBe("Restore campaign")
      })

      test("checkbox is checked", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns?show_archived=true", { user })

        const document = await parseHtml(response)
        const checkbox = expectElement(document, "#showArchivedCheckbox")

        expect(checkbox.hasAttribute("checked")).toBe(true)
      })
    })

    describe("with both active and archived campaigns", () => {
      let activeCampaign: Campaign
      let archivedCampaign: Campaign

      beforeEach(async () => {
        activeCampaign = await campaignFactory.create(
          { created_by: user.id, name: "Active Campaign" },
          testCtx.db
        )
        archivedCampaign = await campaignFactory.create(
          { created_by: user.id, name: "Archived Campaign" },
          testCtx.db
        )
        await testCtx.db`UPDATE campaigns SET archived_at = CURRENT_TIMESTAMP WHERE id = ${archivedCampaign.id}`
      })

      test("displays both campaigns when show_archived=true", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns?show_archived=true", { user })

        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain(activeCampaign.name)
        expect(body).toContain(archivedCampaign.name)
      })

      test("displays only active campaign when show_archived is not set", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns", { user })

        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain(activeCampaign.name)
        expect(body).not.toContain(archivedCampaign.name)
      })

      test("shows checkbox when archived campaigns exist", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns", { user })

        const document = await parseHtml(response)
        const checkbox = expectElement(document, "#showArchivedCheckbox")

        expect(checkbox.hasAttribute("checked")).toBe(false)
        expect(checkbox.getAttribute("hx-get")).toBe("/campaigns?show_archived=true")
      })
    })

    describe("as a player member of an archived campaign", () => {
      let dmUser: User
      let campaign: Campaign

      beforeEach(async () => {
        dmUser = await userFactory.create({}, testCtx.db)
        campaign = await campaignFactory.create(
          { created_by: dmUser.id, name: "DMs Archived Campaign" },
          testCtx.db
        )
        // Add current user as player member
        await campaignMemberFactory.create(
          { campaign_id: campaign.id, user_id: user.id, invited_by: dmUser.id },
          testCtx.db
        )
        // Archive the campaign
        await testCtx.db`UPDATE campaigns SET archived_at = CURRENT_TIMESTAMP WHERE id = ${campaign.id}`
      })

      test("can see archived campaign in list when show_archived=true", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns?show_archived=true", { user })

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain(campaign.name)
      })

      test("does not see archived campaign without show_archived", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns", { user })

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).not.toContain(campaign.name)
      })

      test("shows archived checkbox because player has archived campaigns", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns", { user })

        const document = await parseHtml(response)
        const checkbox = expectElement(document, "#showArchivedCheckbox")

        expect(checkbox).toBeDefined()
      })
    })
  })
})

describe("GET /campaigns/:id", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login", async () => {
      const user = await userFactory.create({}, testCtx.db)
      const campaign = await campaignFactory.create({ created_by: user.id }, testCtx.db)

      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}`)

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let campaign: Campaign

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: user.id }, testCtx.db)
    })

    test("renders the campaign page", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}`, { user })

      expect(response.status).toBe(200)
      const body = await response.text()
      expect(body).toContain(campaign.name)
    })

    describe("when user is not a member", () => {
      let otherUser: User

      beforeEach(async () => {
        otherUser = await userFactory.create({}, testCtx.db)
      })

      test("returns 403 forbidden", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}`, {
          user: otherUser,
        })

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/campaigns")
      })
    })

    describe("when campaign does not exist", () => {
      test("returns 404", async () => {
        const response = await makeRequest(testCtx.app, "/campaigns/nonexistent", { user })

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/campaigns")
      })
    })

    describe("when user is a player of an archived campaign", () => {
      let playerUser: User

      beforeEach(async () => {
        playerUser = await userFactory.create({}, testCtx.db)
        // Add player member
        await campaignMemberFactory.create(
          { campaign_id: campaign.id, user_id: playerUser.id, invited_by: user.id },
          testCtx.db
        )
        // Archive the campaign
        await testCtx.db`UPDATE campaigns SET archived_at = CURRENT_TIMESTAMP WHERE id = ${campaign.id}`
      })

      test("player can still view the archived campaign", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}`, {
          user: playerUser,
        })

        expect(response.status).toBe(200)
        const body = await response.text()
        expect(body).toContain(campaign.name)
      })
    })

    describe("with soft-deleted invites", () => {
      let invitedUser: User

      beforeEach(async () => {
        invitedUser = await userFactory.create({}, testCtx.db)
        // Create a pending invite and soft-delete it
        await campaignMemberFactory.create(
          { campaign_id: campaign.id, user_id: invitedUser.id, invited_by: user.id, pending: true },
          testCtx.db
        )
        await testCtx.db`
          UPDATE campaign_members
          SET deleted_at = CURRENT_TIMESTAMP
          WHERE campaign_id = ${campaign.id} AND user_id = ${invitedUser.id}
        `
      })

      test("soft-deleted members do not appear in the campaign view", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}`, { user })

        expect(response.status).toBe(200)
        const body = await response.text()
        // The soft-deleted user's email should not appear
        expect(body).not.toContain(invitedUser.email)
      })
    })
  })
})

describe("POST /campaigns/:id/archive", () => {
  const testCtx = useTestApp()

  describe("when user is authenticated", () => {
    let user: User
    let campaign: Campaign

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: user.id }, testCtx.db)
    })

    test("archives the campaign", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/archive`, {
        user,
        method: "POST",
      })

      expect(response.status).toBe(204)

      // Verify campaign is archived in database
      const result = await testCtx.db`
        SELECT archived_at FROM campaigns WHERE id = ${campaign.id}
      `
      expect(result[0].archived_at).not.toBeNull()
    })

    test("redirects to campaigns page with show_archived=true", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/archive`, {
        user,
        method: "POST",
      })

      expect(response.headers.get("HX-Redirect")).toBe("/campaigns?show_archived=true")
    })

    test("sets success flash message", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/archive`, {
        user,
        method: "POST",
      })

      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("flash")
    })

    describe("when campaign is already archived", () => {
      beforeEach(async () => {
        await testCtx.db`UPDATE campaigns SET archived_at = CURRENT_TIMESTAMP WHERE id = ${campaign.id}`
      })

      test("returns error", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/archive`, {
          user,
          method: "POST",
        })

        expect(response.status).toBe(400)
        const setCookie = response.headers.get("Set-Cookie")
        expect(setCookie).toContain("flash")
      })
    })

    describe("when user is not a DM", () => {
      let playerUser: User

      beforeEach(async () => {
        playerUser = await userFactory.create({}, testCtx.db)
        // Add as player member
        await campaignMemberFactory.create(
          { campaign_id: campaign.id, user_id: playerUser.id, invited_by: user.id },
          testCtx.db
        )
      })

      test("returns 403 forbidden", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/archive`, {
          user: playerUser,
          method: "POST",
        })

        expect(response.status).toBe(403)
      })
    })

    describe("when user is not a member", () => {
      let otherUser: User

      beforeEach(async () => {
        otherUser = await userFactory.create({}, testCtx.db)
      })

      test("returns unauthorized", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/archive`, {
          user: otherUser,
          method: "POST",
        })

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/campaigns")
      })
    })
  })
})

describe("POST /campaigns/:id/unarchive", () => {
  const testCtx = useTestApp()

  describe("when user is authenticated", () => {
    let user: User
    let campaign: Campaign

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: user.id }, testCtx.db)
      // Archive the campaign
      await testCtx.db`UPDATE campaigns SET archived_at = CURRENT_TIMESTAMP WHERE id = ${campaign.id}`
    })

    test("unarchives the campaign", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/unarchive`, {
        user,
        method: "POST",
      })

      expect(response.status).toBe(204)

      // Verify campaign is unarchived in database
      const result = await testCtx.db`
        SELECT archived_at FROM campaigns WHERE id = ${campaign.id}
      `
      expect(result[0].archived_at).toBeNull()
    })

    test("redirects to campaigns page", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/unarchive`, {
        user,
        method: "POST",
      })

      expect(response.headers.get("HX-Redirect")).toBe("/campaigns")
    })

    test("sets success flash message", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/unarchive`, {
        user,
        method: "POST",
      })

      const setCookie = response.headers.get("Set-Cookie")
      expect(setCookie).toContain("flash")
    })

    describe("when campaign is already active", () => {
      beforeEach(async () => {
        await testCtx.db`UPDATE campaigns SET archived_at = NULL WHERE id = ${campaign.id}`
      })

      test("returns error", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/unarchive`, {
          user,
          method: "POST",
        })

        expect(response.status).toBe(400)
      })
    })

    describe("when campaign name is already in use", () => {
      beforeEach(async () => {
        // Create another active campaign with the same name
        await campaignFactory.create({ created_by: user.id, name: campaign.name }, testCtx.db)
      })

      test("returns error", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/unarchive`, {
          user,
          method: "POST",
        })

        expect(response.status).toBe(400)
        const setCookie = response.headers.get("Set-Cookie")
        expect(setCookie).toContain("flash")
      })
    })

    describe("when user is not a DM", () => {
      let playerUser: User

      beforeEach(async () => {
        playerUser = await userFactory.create({}, testCtx.db)
        // Add as player member
        await campaignMemberFactory.create(
          { campaign_id: campaign.id, user_id: playerUser.id, invited_by: user.id },
          testCtx.db
        )
      })

      test("returns 403 forbidden", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/unarchive`, {
          user: playerUser,
          method: "POST",
        })

        expect(response.status).toBe(403)
      })
    })

    describe("when user is not a member", () => {
      let otherUser: User

      beforeEach(async () => {
        otherUser = await userFactory.create({}, testCtx.db)
      })

      test("returns unauthorized", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/unarchive`, {
          user: otherUser,
          method: "POST",
        })

        expect(response.status).toBe(302)
        expect(response.headers.get("Location")).toBe("/campaigns")
      })
    })
  })
})

describe("Campaign archiving - name reuse", () => {
  const testCtx = useTestApp()

  describe("when a campaign is archived", () => {
    let user: User
    let archivedCampaign: Campaign

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      archivedCampaign = await campaignFactory.create(
        { created_by: user.id, name: "Test Campaign" },
        testCtx.db
      )
      // Archive the campaign
      await testCtx.db`UPDATE campaigns SET archived_at = CURRENT_TIMESTAMP WHERE id = ${archivedCampaign.id}`
    })

    test("allows creating a new campaign with the same name", async () => {
      const newCampaign = await campaignFactory.create(
        { created_by: user.id, name: "Test Campaign" },
        testCtx.db
      )

      expect(newCampaign.name).toBe("Test Campaign")
      expect(newCampaign.id).not.toBe(archivedCampaign.id)
    })

    test("archived campaign is not in active campaign list", async () => {
      const response = await makeRequest(testCtx.app, "/campaigns", { user })

      expect(response.status).toBe(200)
      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      expect(body).toContain("You haven't created or joined any campaigns yet")
      // Should show checkbox since archived campaigns exist
      expect(body).toContain("Show archived campaigns")
    })
  })
})

describe("GET /campaigns/:id/invite", () => {
  const testCtx = useTestApp()

  describe("when user is a DM", () => {
    let user: User
    let campaign: Campaign

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: user.id }, testCtx.db)
    })

    test("returns the invite modal form", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/invite`, { user })

      expect(response.status).toBe(200)
      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      expect(body).toContain("Invite Member")
      expect(body).toContain("Email Address")
    })
  })

  describe("when user is a player", () => {
    let dmUser: User
    let playerUser: User
    let campaign: Campaign

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      playerUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: playerUser.id, invited_by: dmUser.id },
        testCtx.db
      )
    })

    test("redirects with error flash", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/invite`, {
        user: playerUser,
      })

      expect(response.status).toBe(403)
      expect(response.headers.get("HX-Redirect")).toBe(`/campaigns/${campaign.id}`)
    })
  })
})

describe("POST /campaigns/:id/invite", () => {
  const testCtx = useTestApp()

  describe("when user is a DM", () => {
    let user: User
    let campaign: Campaign

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: user.id }, testCtx.db)
    })

    test("creates an invite and returns success", async () => {
      const formData = new FormData()
      formData.append("email", "newplayer@example.com")
      formData.append("role", "player")

      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/invite`, {
        user,
        method: "POST",
        body: formData,
      })

      // Success returns 204 with HX-Refresh to reload the page
      expect(response.status).toBe(204)
      expect(response.headers.get("HX-Refresh")).toBe("true")
      expect(response.headers.get("HX-Trigger")).toBe("closeModal")
    })

    test("creates a campaign member with pending status", async () => {
      const formData = new FormData()
      formData.append("email", "newplayer@example.com")
      formData.append("role", "player")

      await makeRequest(testCtx.app, `/campaigns/${campaign.id}/invite`, {
        user,
        method: "POST",
        body: formData,
      })

      // Check that a pending member was created
      const members = await testCtx.db`
        SELECT cm.*, u.email
        FROM campaign_members cm
        JOIN users u ON u.id = cm.user_id
        WHERE cm.campaign_id = ${campaign.id} AND u.email = 'newplayer@example.com'
      `

      expect(members.length).toBe(1)
      expect(members[0].accepted_at).toBeNull()
      expect(members[0].role).toBe("player")
    })

    test("fails if email is already a member", async () => {
      const existingUser = await userFactory.create({ email: "existing@example.com" }, testCtx.db)
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: existingUser.id, invited_by: user.id },
        testCtx.db
      )

      const formData = new FormData()
      formData.append("email", "existing@example.com")
      formData.append("role", "player")

      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/invite`, {
        user,
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(200)
      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      expect(body).toContain("already a member")
    })
  })

  describe("when user is not a DM", () => {
    let dmUser: User
    let playerUser: User
    let campaign: Campaign

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      playerUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: playerUser.id, invited_by: dmUser.id },
        testCtx.db
      )
    })

    test("redirects with error flash", async () => {
      const formData = new FormData()
      formData.append("email", "newplayer@example.com")
      formData.append("role", "player")

      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/invite`, {
        user: playerUser,
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(403)
      expect(response.headers.get("HX-Redirect")).toBe(`/campaigns/${campaign.id}`)
    })
  })
})

describe("POST /campaigns/:id/accept", () => {
  const testCtx = useTestApp()

  describe("when user has a pending invite", () => {
    let dmUser: User
    let invitedUser: User
    let campaign: Campaign

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      invitedUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      // Create pending invite
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: invitedUser.id, invited_by: dmUser.id, pending: true },
        testCtx.db
      )
    })

    test("accepts the invite and redirects to campaign", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/accept`, {
        user: invitedUser,
        method: "POST",
      })

      expect(response.status).toBe(200)
      expect(response.headers.get("HX-Redirect")).toBe(`/campaigns/${campaign.id}`)
    })

    test("updates the membership to accepted", async () => {
      await makeRequest(testCtx.app, `/campaigns/${campaign.id}/accept`, {
        user: invitedUser,
        method: "POST",
      })

      const members = await testCtx.db`
        SELECT * FROM campaign_members
        WHERE campaign_id = ${campaign.id} AND user_id = ${invitedUser.id}
      `

      expect(members[0].accepted_at).not.toBeNull()
    })
  })

  describe("when user has no invite", () => {
    let dmUser: User
    let otherUser: User
    let campaign: Campaign

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      otherUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
    })

    test("returns 400 with error", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/accept`, {
        user: otherUser,
        method: "POST",
      })

      expect(response.status).toBe(400)
      expect(response.headers.get("HX-Redirect")).toBe("/campaigns")
    })
  })
})

describe("POST /campaigns/:id/decline", () => {
  const testCtx = useTestApp()

  describe("when user has a pending invite", () => {
    let dmUser: User
    let invitedUser: User
    let campaign: Campaign

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      invitedUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      // Create pending invite
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: invitedUser.id, invited_by: dmUser.id, pending: true },
        testCtx.db
      )
    })

    test("declines the invite and redirects to campaigns", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/decline`, {
        user: invitedUser,
        method: "POST",
      })

      expect(response.status).toBe(200)
      expect(response.headers.get("HX-Redirect")).toBe("/campaigns")
    })

    test("updates the membership to declined", async () => {
      await makeRequest(testCtx.app, `/campaigns/${campaign.id}/decline`, {
        user: invitedUser,
        method: "POST",
      })

      const members = await testCtx.db`
        SELECT * FROM campaign_members
        WHERE campaign_id = ${campaign.id} AND user_id = ${invitedUser.id}
      `

      expect(members[0].declined_at).not.toBeNull()
    })
  })
})

describe("GET /campaigns with pending invites", () => {
  const testCtx = useTestApp()

  describe("when user has a pending invite", () => {
    let dmUser: User
    let invitedUser: User
    let campaign: Campaign

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      invitedUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      // Create pending invite
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: invitedUser.id, invited_by: dmUser.id, pending: true },
        testCtx.db
      )
    })

    test("shows the campaign with pending invite badge and inviter", async () => {
      const response = await makeRequest(testCtx.app, "/campaigns", { user: invitedUser })

      expect(response.status).toBe(200)
      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      expect(body).toContain(campaign.name)
      expect(body).toContain("Pending Invite")
      expect(body).toContain(`from ${dmUser.email}`)
    })

    test("shows accept button", async () => {
      const response = await makeRequest(testCtx.app, "/campaigns", { user: invitedUser })

      const document = await parseHtml(response)
      const acceptButton = expectElement(document, `[data-testid="accept-${campaign.id}"]`)

      expect(acceptButton.getAttribute("hx-post")).toBe(`/campaigns/${campaign.id}/accept`)
    })

    test("shows decline button", async () => {
      const response = await makeRequest(testCtx.app, "/campaigns", { user: invitedUser })

      const document = await parseHtml(response)
      const declineButton = expectElement(document, `[data-testid="decline-${campaign.id}"]`)

      expect(declineButton.getAttribute("hx-post")).toBe(`/campaigns/${campaign.id}/decline`)
    })
  })
})

describe("DELETE /campaigns/:id/members/:memberId", () => {
  const testCtx = useTestApp()

  describe("when user is a DM", () => {
    let dmUser: User
    let invitedUser: User
    let campaign: Campaign
    let memberId: string

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      invitedUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
    })

    describe("with a pending invite", () => {
      beforeEach(async () => {
        const member = await campaignMemberFactory.create(
          {
            campaign_id: campaign.id,
            user_id: invitedUser.id,
            invited_by: dmUser.id,
            pending: true,
          },
          testCtx.db
        )
        memberId = member.id
      })

      test("soft-deletes the pending invite", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/campaigns/${campaign.id}/members/${memberId}`,
          { user: dmUser, method: "DELETE" }
        )

        expect(response.status).toBe(204)
        expect(response.headers.get("HX-Refresh")).toBe("true")

        // Verify member was soft-deleted (deleted_at is set)
        const members = await testCtx.db`
          SELECT * FROM campaign_members WHERE id = ${memberId}
        `
        expect(members.length).toBe(1)
        expect(members[0].deleted_at).not.toBeNull()
      })

      test("sets success flash message", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/campaigns/${campaign.id}/members/${memberId}`,
          { user: dmUser, method: "DELETE" }
        )

        const setCookie = response.headers.get("Set-Cookie")
        expect(setCookie).toContain("flash")
      })
    })

    describe("with a declined invite", () => {
      beforeEach(async () => {
        const member = await campaignMemberFactory.create(
          {
            campaign_id: campaign.id,
            user_id: invitedUser.id,
            invited_by: dmUser.id,
            pending: true,
          },
          testCtx.db
        )
        memberId = member.id
        // Decline the invite
        await testCtx.db`
          UPDATE campaign_members
          SET declined_at = CURRENT_TIMESTAMP
          WHERE id = ${memberId}
        `
      })

      test("soft-deletes the declined invite", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/campaigns/${campaign.id}/members/${memberId}`,
          { user: dmUser, method: "DELETE" }
        )

        expect(response.status).toBe(204)

        // Verify member was soft-deleted (deleted_at is set)
        const members = await testCtx.db`
          SELECT * FROM campaign_members WHERE id = ${memberId}
        `
        expect(members.length).toBe(1)
        expect(members[0].deleted_at).not.toBeNull()
      })
    })

    describe("with an accepted member", () => {
      beforeEach(async () => {
        const member = await campaignMemberFactory.create(
          { campaign_id: campaign.id, user_id: invitedUser.id, invited_by: dmUser.id },
          testCtx.db
        )
        memberId = member.id
      })

      test("returns error and does not delete", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/campaigns/${campaign.id}/members/${memberId}`,
          { user: dmUser, method: "DELETE" }
        )

        expect(response.status).toBe(400)

        // Verify member was not deleted
        const members = await testCtx.db`
          SELECT * FROM campaign_members WHERE id = ${memberId}
        `
        expect(members.length).toBe(1)
      })
    })

    describe("with non-existent member", () => {
      test("returns error", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/campaigns/${campaign.id}/members/nonexistent`,
          { user: dmUser, method: "DELETE" }
        )

        expect(response.status).toBe(400)
      })
    })

    describe("with member from different campaign", () => {
      let otherCampaign: Campaign
      let otherMemberId: string

      beforeEach(async () => {
        otherCampaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
        const member = await campaignMemberFactory.create(
          {
            campaign_id: otherCampaign.id,
            user_id: invitedUser.id,
            invited_by: dmUser.id,
            pending: true,
          },
          testCtx.db
        )
        otherMemberId = member.id
      })

      test("returns error", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/campaigns/${campaign.id}/members/${otherMemberId}`,
          { user: dmUser, method: "DELETE" }
        )

        expect(response.status).toBe(400)
      })
    })
  })

  describe("when user is a player", () => {
    let dmUser: User
    let playerUser: User
    let invitedUser: User
    let campaign: Campaign
    let memberId: string

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      playerUser = await userFactory.create({}, testCtx.db)
      invitedUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      // Add player member
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: playerUser.id, invited_by: dmUser.id },
        testCtx.db
      )
      // Create pending invite
      const member = await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: invitedUser.id, invited_by: dmUser.id, pending: true },
        testCtx.db
      )
      memberId = member.id
    })

    test("returns 403 forbidden", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/members/${memberId}`,
        { user: playerUser, method: "DELETE" }
      )

      expect(response.status).toBe(403)
    })
  })

  describe("when user is not a member", () => {
    let dmUser: User
    let otherUser: User
    let invitedUser: User
    let campaign: Campaign
    let memberId: string

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      otherUser = await userFactory.create({}, testCtx.db)
      invitedUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      // Create pending invite
      const member = await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: invitedUser.id, invited_by: dmUser.id, pending: true },
        testCtx.db
      )
      memberId = member.id
    })

    test("returns unauthorized", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/members/${memberId}`,
        { user: otherUser, method: "DELETE" }
      )

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/campaigns")
    })
  })
})

describe("GET /campaigns/:id/add-character", () => {
  const testCtx = useTestApp()

  describe("when user is a campaign member", () => {
    let dmUser: User
    let playerUser: User
    let campaign: Campaign

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      playerUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: playerUser.id, invited_by: dmUser.id },
        testCtx.db
      )
    })

    describe("with available characters", () => {
      let character: Character

      beforeEach(async () => {
        character = await characterFactory.create(
          { user_id: playerUser.id, class: "fighter", level: 3 },
          testCtx.db
        )
      })

      test("returns modal with character selection", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/add-character`, {
          user: playerUser,
        })

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain("Add Character")
        expect(body).toContain(character.name)
        expect(body).toContain("Add to Campaign")
      })
    })

    describe("with no available characters", () => {
      test("returns modal with empty state", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/add-character`, {
          user: playerUser,
        })

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain("No Characters Available")
        expect(body).toContain("Create a character first")
      })
    })

    describe("with character already in campaign", () => {
      let character: Character

      beforeEach(async () => {
        character = await characterFactory.create(
          { user_id: playerUser.id, class: "wizard", level: 5 },
          testCtx.db
        )
        // Add character to campaign
        await testCtx.db`
          INSERT INTO campaign_characters (id, campaign_id, character_id, added_by, revealed_at)
          VALUES (${ulid()}, ${campaign.id}, ${character.id}, ${playerUser.id}, CURRENT_TIMESTAMP)
        `
      })

      test("does not show character in the list", async () => {
        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/add-character`, {
          user: playerUser,
        })

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        // Character should not be in the list since it's already in the campaign
        expect(body).toContain("No Characters Available")
      })
    })
  })

  describe("when user is not a member", () => {
    let dmUser: User
    let otherUser: User
    let campaign: Campaign

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      otherUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
    })

    test("redirects to campaigns list", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/add-character`, {
        user: otherUser,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/campaigns")
    })
  })
})

describe("POST /campaigns/:id/characters/:characterId", () => {
  const testCtx = useTestApp()

  describe("when user is a campaign member", () => {
    let dmUser: User
    let playerUser: User
    let campaign: Campaign
    let character: Character

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      playerUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: playerUser.id, invited_by: dmUser.id },
        testCtx.db
      )
      character = await characterFactory.create(
        { user_id: playerUser.id, class: "rogue", level: 2 },
        testCtx.db
      )
    })

    test("adds character to campaign and returns success", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/characters/${character.id}`,
        { user: playerUser, method: "POST" }
      )

      expect(response.status).toBe(204)
      expect(response.headers.get("HX-Refresh")).toBe("true")
      expect(response.headers.get("HX-Trigger")).toBe("closeModal")
    })

    test("creates campaign_character record", async () => {
      await makeRequest(testCtx.app, `/campaigns/${campaign.id}/characters/${character.id}`, {
        user: playerUser,
        method: "POST",
      })

      const campaignChars = await testCtx.db`
        SELECT * FROM campaign_characters
        WHERE campaign_id = ${campaign.id} AND character_id = ${character.id}
      `

      expect(campaignChars.length).toBe(1)
      expect(campaignChars[0].added_by).toBe(playerUser.id)
      expect(campaignChars[0].revealed_at).not.toBeNull()
    })

    describe("when character is already in campaign", () => {
      beforeEach(async () => {
        // Add the character to the campaign
        await testCtx.db`
          INSERT INTO campaign_characters (id, campaign_id, character_id, added_by, revealed_at)
          VALUES (${ulid()}, ${campaign.id}, ${character.id}, ${playerUser.id}, CURRENT_TIMESTAMP)
        `
        // Create another character so modal has something to display with the error
        await characterFactory.create(
          { user_id: playerUser.id, class: "wizard", level: 5 },
          testCtx.db
        )
      })

      test("returns modal with error", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/campaigns/${campaign.id}/characters/${character.id}`,
          { user: playerUser, method: "POST" }
        )

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain("Character already in this campaign")
      })
    })

    describe("when character does not exist", () => {
      test("returns modal with error", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/campaigns/${campaign.id}/characters/nonexistent`,
          { user: playerUser, method: "POST" }
        )

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain("Character not found")
      })
    })

    describe("when character belongs to another user", () => {
      let otherCharacter: Character

      beforeEach(async () => {
        otherCharacter = await characterFactory.create(
          { user_id: dmUser.id, class: "cleric", level: 4 },
          testCtx.db
        )
      })

      test("returns modal with error", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/campaigns/${campaign.id}/characters/${otherCharacter.id}`,
          { user: playerUser, method: "POST" }
        )

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain("You don't own this character")
      })
    })
  })

  describe("when user is not a member", () => {
    let dmUser: User
    let otherUser: User
    let campaign: Campaign
    let character: Character

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      otherUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      character = await characterFactory.create({ user_id: otherUser.id }, testCtx.db)
    })

    test("redirects to campaigns list", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/characters/${character.id}`,
        { user: otherUser, method: "POST" }
      )

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/campaigns")
    })
  })
})

describe("DELETE /campaigns/:id/characters/:characterId", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/campaigns/123/characters/456", {
        method: "DELETE",
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is the character owner", () => {
    let dmUser: User
    let playerUser: User
    let campaign: Campaign
    let character: Character

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      playerUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      character = await characterFactory.create({ user_id: playerUser.id }, testCtx.db)

      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: playerUser.id, invited_by: dmUser.id },
        testCtx.db
      )
      await campaignCharacterFactory.create(
        { campaign_id: campaign.id, character_id: character.id, added_by: playerUser.id },
        testCtx.db
      )
    })

    test("removes the character from the campaign", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/characters/${character.id}`,
        { user: playerUser, method: "DELETE" }
      )

      expect(response.status).toBe(204)
      expect(response.headers.get("HX-Refresh")).toBe("true")
    })

    test("cannot remove another player's character", async () => {
      const otherPlayer = await userFactory.create({}, testCtx.db)
      const otherCharacter = await characterFactory.create({ user_id: otherPlayer.id }, testCtx.db)

      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: otherPlayer.id, invited_by: dmUser.id },
        testCtx.db
      )
      await campaignCharacterFactory.create(
        { campaign_id: campaign.id, character_id: otherCharacter.id, added_by: otherPlayer.id },
        testCtx.db
      )

      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/characters/${otherCharacter.id}`,
        { user: playerUser, method: "DELETE" }
      )

      expect(response.status).toBe(400)
    })
  })

  describe("when user is DM", () => {
    let dmUser: User
    let playerUser: User
    let campaign: Campaign
    let character: Character

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      playerUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      character = await characterFactory.create({ user_id: playerUser.id }, testCtx.db)

      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: playerUser.id, invited_by: dmUser.id },
        testCtx.db
      )
      await campaignCharacterFactory.create(
        { campaign_id: campaign.id, character_id: character.id, added_by: playerUser.id },
        testCtx.db
      )
    })

    test("can remove any character from the campaign", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/characters/${character.id}`,
        { user: dmUser, method: "DELETE" }
      )

      expect(response.status).toBe(204)
      expect(response.headers.get("HX-Refresh")).toBe("true")
    })
  })

  describe("when character is not in campaign", () => {
    let dmUser: User
    let campaign: Campaign
    let character: Character

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      character = await characterFactory.create({ user_id: dmUser.id }, testCtx.db)
    })

    test("returns error", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/characters/${character.id}`,
        { user: dmUser, method: "DELETE" }
      )

      expect(response.status).toBe(400)
    })
  })

  describe("when user is not a member", () => {
    let dmUser: User
    let otherUser: User
    let campaign: Campaign
    let character: Character

    beforeEach(async () => {
      dmUser = await userFactory.create({}, testCtx.db)
      otherUser = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dmUser.id }, testCtx.db)
      character = await characterFactory.create({ user_id: dmUser.id }, testCtx.db)

      await campaignCharacterFactory.create(
        { campaign_id: campaign.id, character_id: character.id, added_by: dmUser.id },
        testCtx.db
      )
    })

    test("redirects to campaigns list", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/characters/${character.id}`,
        { user: otherUser, method: "DELETE" }
      )

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toBe("/campaigns")
    })
  })
})
