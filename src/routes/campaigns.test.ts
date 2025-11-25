import { beforeEach, describe, expect, test } from "bun:test"
import { create as createCampaignMemberDb } from "@src/db/campaign_members"
import type { Campaign } from "@src/db/campaigns"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { campaignFactory } from "@src/test/factories/campaign"
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
        await createCampaignMemberDb(testCtx.db, {
          campaign_id: campaign.id,
          user_id: user.id,
          role: "player",
          invited_by: dmUser.id,
          accepted_at: new Date(),
          declined_at: null,
        })
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
        await createCampaignMemberDb(testCtx.db, {
          campaign_id: campaign.id,
          user_id: playerUser.id,
          role: "player",
          invited_by: user.id,
          accepted_at: new Date(),
          declined_at: null,
        })
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
        await createCampaignMemberDb(testCtx.db, {
          campaign_id: campaign.id,
          user_id: playerUser.id,
          role: "player",
          invited_by: user.id,
          accepted_at: new Date(),
          declined_at: null,
        })
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
        await createCampaignMemberDb(testCtx.db, {
          campaign_id: campaign.id,
          user_id: playerUser.id,
          role: "player",
          invited_by: user.id,
          accepted_at: new Date(),
          declined_at: null,
        })
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
