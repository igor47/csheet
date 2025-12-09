import { beforeEach, describe, expect, test } from "bun:test"
import type { CampaignMember } from "@src/db/campaign_members"
import type { Campaign } from "@src/db/campaigns"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import {
  campaignCharacterFactory,
  campaignFactory,
  campaignMemberFactory,
} from "@src/test/factories/campaign"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { makeRequest, parseHtml } from "@src/test/http"

describe("GET /campaigns/:id/change-role (self)", () => {
  const testCtx = useTestApp()

  describe("when user is a DM with multiple DMs", () => {
    let dm1: User
    let dm2: User
    let campaign: Campaign

    beforeEach(async () => {
      dm1 = await userFactory.create({}, testCtx.db)
      dm2 = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dm1.id }, testCtx.db)
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: dm2.id, invited_by: dm1.id, role: "dm" },
        testCtx.db
      )
    })

    test("returns the change role form", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/change-role`, {
        user: dm1,
      })

      expect(response.status).toBe(200)
      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      expect(body).toContain("Change My Role")
      expect(body).toContain("Player")
      expect(body).toContain("Viewer")
    })

    test("shows warning about losing management access", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/change-role`, {
        user: dm1,
      })

      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      expect(body).toContain("won't be able to manage")
    })
  })

  describe("when user is sole DM", () => {
    let dm: User
    let campaign: Campaign

    beforeEach(async () => {
      dm = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dm.id }, testCtx.db)
    })

    test("shows warning that role cannot be changed", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/change-role`, {
        user: dm,
      })

      expect(response.status).toBe(200)
      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      expect(body).toContain("only DM")
    })
  })

  describe("when user is a player", () => {
    let dm: User
    let player: User
    let campaign: Campaign

    beforeEach(async () => {
      dm = await userFactory.create({}, testCtx.db)
      player = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dm.id }, testCtx.db)
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: player.id, invited_by: dm.id, role: "player" },
        testCtx.db
      )
    })

    test("returns 403", async () => {
      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/change-role`, {
        user: player,
      })

      expect(response.status).toBe(403)
    })
  })
})

describe("POST /campaigns/:id/change-role (self)", () => {
  const testCtx = useTestApp()

  describe("DM changing to player", () => {
    let dm1: User
    let dm2: User
    let campaign: Campaign

    beforeEach(async () => {
      dm1 = await userFactory.create({}, testCtx.db)
      dm2 = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dm1.id }, testCtx.db)
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: dm2.id, invited_by: dm1.id, role: "dm" },
        testCtx.db
      )
    })

    test("changes role successfully", async () => {
      const formData = new FormData()
      formData.append("newRole", "player")

      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/change-role`, {
        user: dm1,
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(204)
      expect(response.headers.get("HX-Refresh")).toBe("true")

      // Verify role changed in database
      const members = await testCtx.db`
        SELECT * FROM campaign_members
        WHERE campaign_id = ${campaign.id} AND user_id = ${dm1.id}
      `
      expect(members[0].role).toBe("player")
    })

    describe("with NPCs", () => {
      let npcCharacter: Character

      beforeEach(async () => {
        npcCharacter = await characterFactory.create({ user_id: dm1.id }, testCtx.db)
        await campaignCharacterFactory.create(
          {
            campaign_id: campaign.id,
            character_id: npcCharacter.id,
            added_by: dm1.id,
            revealed_at: null, // Hidden NPC
          },
          testCtx.db
        )
      })

      test("reveals NPCs when changing role", async () => {
        const formData = new FormData()
        formData.append("newRole", "player")

        await makeRequest(testCtx.app, `/campaigns/${campaign.id}/change-role`, {
          user: dm1,
          method: "POST",
          body: formData,
        })

        // Verify NPC is now revealed
        const chars = await testCtx.db`
          SELECT * FROM campaign_characters
          WHERE campaign_id = ${campaign.id} AND character_id = ${npcCharacter.id}
        `
        expect(chars[0].revealed_at).not.toBeNull()
      })
    })
  })

  describe("DM changing to viewer", () => {
    let dm1: User
    let dm2: User
    let campaign: Campaign

    beforeEach(async () => {
      dm1 = await userFactory.create({}, testCtx.db)
      dm2 = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dm1.id }, testCtx.db)
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: dm2.id, invited_by: dm1.id, role: "dm" },
        testCtx.db
      )
    })

    test("changes role successfully when no NPCs", async () => {
      const formData = new FormData()
      formData.append("newRole", "viewer")

      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/change-role`, {
        user: dm1,
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(204)

      const members = await testCtx.db`
        SELECT * FROM campaign_members
        WHERE campaign_id = ${campaign.id} AND user_id = ${dm1.id}
      `
      expect(members[0].role).toBe("viewer")
    })

    describe("with NPCs", () => {
      beforeEach(async () => {
        const npcCharacter = await characterFactory.create({ user_id: dm1.id }, testCtx.db)
        await campaignCharacterFactory.create(
          {
            campaign_id: campaign.id,
            character_id: npcCharacter.id,
            added_by: dm1.id,
            revealed_at: null, // Hidden NPC
          },
          testCtx.db
        )
      })

      test("returns error - must remove NPCs first", async () => {
        const formData = new FormData()
        formData.append("newRole", "viewer")

        const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/change-role`, {
          user: dm1,
          method: "POST",
          body: formData,
        })

        expect(response.status).toBe(200) // Returns form with error
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain("Remove your NPCs")
      })
    })
  })

  describe("sole DM trying to change role", () => {
    let dm: User
    let campaign: Campaign

    beforeEach(async () => {
      dm = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dm.id }, testCtx.db)
    })

    test("returns error", async () => {
      const formData = new FormData()
      formData.append("newRole", "player")

      const response = await makeRequest(testCtx.app, `/campaigns/${campaign.id}/change-role`, {
        user: dm,
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(200) // Returns form with error
      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      expect(body).toContain("only DM")
    })
  })
})

describe("GET /campaigns/:id/members/:memberId/change-role (DM changing other)", () => {
  const testCtx = useTestApp()

  describe("DM changing player role", () => {
    let dm: User
    let player: User
    let campaign: Campaign
    let playerMember: CampaignMember

    beforeEach(async () => {
      dm = await userFactory.create({}, testCtx.db)
      player = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dm.id }, testCtx.db)
      playerMember = await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: player.id, invited_by: dm.id, role: "player" },
        testCtx.db
      )
    })

    test("returns the change role form", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/members/${playerMember.id}/change-role`,
        { user: dm }
      )

      expect(response.status).toBe(200)
      const document = await parseHtml(response)
      const body = document.body.textContent || ""

      expect(body).toContain("Change Role")
      expect(body).toContain(player.email)
    })
  })

  describe("DM trying to change another DM's role", () => {
    let dm1: User
    let dm2: User
    let campaign: Campaign
    let dm2Member: CampaignMember

    beforeEach(async () => {
      dm1 = await userFactory.create({}, testCtx.db)
      dm2 = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dm1.id }, testCtx.db)
      dm2Member = await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: dm2.id, invited_by: dm1.id, role: "dm" },
        testCtx.db
      )
    })

    test("returns error", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/members/${dm2Member.id}/change-role`,
        { user: dm1 }
      )

      expect(response.status).toBe(400)
    })
  })

  describe("player trying to change another's role", () => {
    let dm: User
    let player1: User
    let player2: User
    let campaign: Campaign
    let player2Member: CampaignMember

    beforeEach(async () => {
      dm = await userFactory.create({}, testCtx.db)
      player1 = await userFactory.create({}, testCtx.db)
      player2 = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dm.id }, testCtx.db)
      await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: player1.id, invited_by: dm.id, role: "player" },
        testCtx.db
      )
      player2Member = await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: player2.id, invited_by: dm.id, role: "player" },
        testCtx.db
      )
    })

    test("returns 403", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/members/${player2Member.id}/change-role`,
        { user: player1 }
      )

      expect(response.status).toBe(403)
    })
  })
})

describe("POST /campaigns/:id/members/:memberId/change-role (DM changing other)", () => {
  const testCtx = useTestApp()

  describe("DM promoting player to DM", () => {
    let dm: User
    let player: User
    let campaign: Campaign
    let playerMember: CampaignMember

    beforeEach(async () => {
      dm = await userFactory.create({}, testCtx.db)
      player = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dm.id }, testCtx.db)
      playerMember = await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: player.id, invited_by: dm.id, role: "player" },
        testCtx.db
      )
    })

    test("changes role to DM", async () => {
      const formData = new FormData()
      formData.append("newRole", "dm")

      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/members/${playerMember.id}/change-role`,
        { user: dm, method: "POST", body: formData }
      )

      expect(response.status).toBe(204)

      const members = await testCtx.db`
        SELECT * FROM campaign_members WHERE id = ${playerMember.id}
      `
      expect(members[0].role).toBe("dm")
    })

    describe("player has characters", () => {
      beforeEach(async () => {
        const character = await characterFactory.create({ user_id: player.id }, testCtx.db)
        await campaignCharacterFactory.create(
          { campaign_id: campaign.id, character_id: character.id, added_by: player.id },
          testCtx.db
        )
      })

      test("still allows promotion (characters become NPCs)", async () => {
        const formData = new FormData()
        formData.append("newRole", "dm")

        const response = await makeRequest(
          testCtx.app,
          `/campaigns/${campaign.id}/members/${playerMember.id}/change-role`,
          { user: dm, method: "POST", body: formData }
        )

        expect(response.status).toBe(204)
      })
    })
  })

  describe("DM demoting player to viewer", () => {
    let dm: User
    let player: User
    let campaign: Campaign
    let playerMember: CampaignMember

    beforeEach(async () => {
      dm = await userFactory.create({}, testCtx.db)
      player = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dm.id }, testCtx.db)
      playerMember = await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: player.id, invited_by: dm.id, role: "player" },
        testCtx.db
      )
    })

    test("changes role to viewer when no characters", async () => {
      const formData = new FormData()
      formData.append("newRole", "viewer")

      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/members/${playerMember.id}/change-role`,
        { user: dm, method: "POST", body: formData }
      )

      expect(response.status).toBe(204)

      const members = await testCtx.db`
        SELECT * FROM campaign_members WHERE id = ${playerMember.id}
      `
      expect(members[0].role).toBe("viewer")
    })

    describe("player has characters", () => {
      beforeEach(async () => {
        const character = await characterFactory.create({ user_id: player.id }, testCtx.db)
        await campaignCharacterFactory.create(
          { campaign_id: campaign.id, character_id: character.id, added_by: player.id },
          testCtx.db
        )
      })

      test("returns error - must remove characters first", async () => {
        const formData = new FormData()
        formData.append("newRole", "viewer")

        const response = await makeRequest(
          testCtx.app,
          `/campaigns/${campaign.id}/members/${playerMember.id}/change-role`,
          { user: dm, method: "POST", body: formData }
        )

        expect(response.status).toBe(200) // Returns form with error
        const document = await parseHtml(response)
        const body = document.body.textContent || ""

        expect(body).toContain("Remove")
        expect(body).toContain("characters")
      })
    })
  })

  describe("DM promoting viewer to player", () => {
    let dm: User
    let viewer: User
    let campaign: Campaign
    let viewerMember: CampaignMember

    beforeEach(async () => {
      dm = await userFactory.create({}, testCtx.db)
      viewer = await userFactory.create({}, testCtx.db)
      campaign = await campaignFactory.create({ created_by: dm.id }, testCtx.db)
      viewerMember = await campaignMemberFactory.create(
        { campaign_id: campaign.id, user_id: viewer.id, invited_by: dm.id, role: "viewer" },
        testCtx.db
      )
    })

    test("changes role to player", async () => {
      const formData = new FormData()
      formData.append("newRole", "player")

      const response = await makeRequest(
        testCtx.app,
        `/campaigns/${campaign.id}/members/${viewerMember.id}/change-role`,
        { user: dm, method: "POST", body: formData }
      )

      expect(response.status).toBe(204)

      const members = await testCtx.db`
        SELECT * FROM campaign_members WHERE id = ${viewerMember.id}
      `
      expect(members[0].role).toBe("player")
    })
  })
})
