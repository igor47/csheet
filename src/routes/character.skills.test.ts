import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("GET /characters/:id/edit/skills", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/characters/test-id/edit/skills")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    })

    test("returns status 200", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/skills`,
        {
          user,
        }
      )

      expect(response.status).toBe(200)
    })

    test("renders the skills edit form with title", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/skills`,
        {
          user,
        }
      )

      const document = await parseHtml(response)
      const title = expectElement(document, ".modal-title")
      expect(title.textContent).toBe("Edit Skills")
    })

    test("displays proficiency input fields for all 18 skills", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/skills`,
        {
          user,
        }
      )

      const document = await parseHtml(response)
      const skills = [
        "acrobatics",
        "animal handling",
        "arcana",
        "athletics",
        "deception",
        "history",
        "insight",
        "intimidation",
        "investigation",
        "medicine",
        "nature",
        "perception",
        "performance",
        "persuasion",
        "religion",
        "sleight of hand",
        "stealth",
        "survival",
      ]

      for (const skill of skills) {
        // Check for proficiency radio buttons
        // Sanitize skill name (replace spaces with underscores)
        const sanitizedSkill = skill.replace(/\s+/g, "_")
        const proficiencyFieldName = `${sanitizedSkill}_proficiency`

        const noneInput = expectElement(document, `#${proficiencyFieldName}_none`)
        expect(noneInput.getAttribute("type")).toBe("radio")
        expect(noneInput.getAttribute("name")).toBe(proficiencyFieldName)

        const halfInput = expectElement(document, `#${proficiencyFieldName}_half`)
        expect(halfInput.getAttribute("type")).toBe("radio")

        const proficientInput = expectElement(document, `#${proficiencyFieldName}_proficient`)
        expect(proficientInput.getAttribute("type")).toBe("radio")

        const expertInput = expectElement(document, `#${proficiencyFieldName}_expert`)
        expect(expertInput.getAttribute("type")).toBe("radio")
      }
    })

    test("pre-selects current skill proficiency in radio buttons", async () => {
      // Set acrobatics to proficient (use future timestamp to ensure it's the latest)
      await testCtx.db`
        INSERT INTO char_skills (id, character_id, skill, proficiency, created_at, updated_at)
        VALUES (
          'test-skill-prof',
          ${character.id},
          'acrobatics',
          'proficient',
          NOW() + INTERVAL '1 second',
          NOW() + INTERVAL '1 second'
        )
      `

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/skills`,
        {
          user,
        }
      )

      const document = await parseHtml(response)
      const acrobaticsProfInput = expectElement(document, "#acrobatics_proficiency_proficient")
      // When checked={true}, Hono JSX renders checked="" attribute
      expect(acrobaticsProfInput.getAttribute("checked")).toBe("")
    })

    test("has a note textarea", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/skills`,
        {
          user,
        }
      )

      const document = await parseHtml(response)
      const noteInput = expectElement(document, "#note")
      expect(noteInput.tagName).toBe("TEXTAREA")
    })

    describe("when character belongs to another user", () => {
      let otherUser: User

      beforeEach(async () => {
        otherUser = await userFactory.create({}, testCtx.db)
      })

      test("returns 403", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/skills`,
          {
            user: otherUser,
          }
        )

        expect(response.status).toBe(403)
      })
    })
  })
})

describe("POST /characters/:id/edit/skills", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const formData = new FormData()
      formData.append("acrobatics_proficiency", "proficient")

      const response = await makeRequest(testCtx.app, "/characters/test-id/edit/skills", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    })

    describe("with valid data changing one skill", () => {
      test("updates the skill proficiency in database", async () => {
        const formData = new FormData()
        formData.append("acrobatics_proficiency", "proficient") // Change from default "none"
        formData.append("note", "Trained in acrobatics!")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/skills`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)

        // Verify database was updated
        const updatedSkills = await testCtx.db`
          SELECT * FROM char_skills
          WHERE character_id = ${character.id}
          AND skill = 'acrobatics'
          ORDER BY created_at DESC
          LIMIT 1
        `
        expect(updatedSkills[0].proficiency).toBe("proficient")
        expect(updatedSkills[0].note).toBe("Trained in acrobatics!")
      })

      test("returns OOB swaps for dependent panels", async () => {
        const formData = new FormData()
        formData.append("acrobatics_proficiency", "proficient")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/skills`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)
        const document = await parseHtml(response)

        for (const panelClass of ["#skills-panel", "#character-info"]) {
          const panel = expectElement(document, panelClass)
          expect(panel.attributes.getNamedItem("hx-swap-oob")?.value).toBe("true")
        }
      })

      test("closes the modal", async () => {
        const formData = new FormData()
        formData.append("acrobatics_proficiency", "proficient")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/skills`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.headers.get("HX-Trigger")).toContain("closeEditModal")
      })
    })

    describe("with valid data changing multiple skills", () => {
      test("updates all changed skills with same note", async () => {
        const formData = new FormData()
        formData.append("acrobatics_proficiency", "proficient") // Change
        formData.append("stealth_proficiency", "expert") // Change
        formData.append("perception_proficiency", "half") // Change
        formData.append("note", "Multiple skill improvements")

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/skills`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)

        // Verify acrobatics change
        const acrobaticsSkill = await testCtx.db`
          SELECT * FROM char_skills
          WHERE character_id = ${character.id}
          AND skill = 'acrobatics'
          ORDER BY created_at DESC
          LIMIT 1
        `
        expect(acrobaticsSkill[0].proficiency).toBe("proficient")
        expect(acrobaticsSkill[0].note).toBe("Multiple skill improvements")

        // Verify stealth change
        const stealthSkill = await testCtx.db`
          SELECT * FROM char_skills
          WHERE character_id = ${character.id}
          AND skill = 'stealth'
          ORDER BY created_at DESC
          LIMIT 1
        `
        expect(stealthSkill[0].proficiency).toBe("expert")
        expect(stealthSkill[0].note).toBe("Multiple skill improvements")

        // Verify perception change
        const perceptionSkill = await testCtx.db`
          SELECT * FROM char_skills
          WHERE character_id = ${character.id}
          AND skill = 'perception'
          ORDER BY created_at DESC
          LIMIT 1
        `
        expect(perceptionSkill[0].proficiency).toBe("half")
        expect(perceptionSkill[0].note).toBe("Multiple skill improvements")
      })

      test("only creates records for changed skills", async () => {
        // Count existing skills
        const beforeCount = await testCtx.db`
          SELECT COUNT(*) as count FROM char_skills
          WHERE character_id = ${character.id}
        `

        const formData = new FormData()
        formData.append("acrobatics_proficiency", "proficient") // Change only this

        await makeRequest(testCtx.app, `/characters/${character.id}/edit/skills`, {
          user,
          method: "POST",
          body: formData,
        })

        // Should only create 1 new record
        const afterCount = await testCtx.db`
          SELECT COUNT(*) as count FROM char_skills
          WHERE character_id = ${character.id}
        `
        // Cast to number to avoid string concatenation
        const before = Number(beforeCount[0].count)
        const after = Number(afterCount[0].count)
        expect(after).toBe(before + 1)
      })
    })

    describe("with invalid data", () => {
      test("rejects when no skills are changed", async () => {
        // Get current proficiencies to submit unchanged
        const currentSkills = await testCtx.db`
          SELECT skill, proficiency
          FROM char_skills
          WHERE character_id = ${character.id}
          AND created_at IN (
            SELECT MAX(created_at)
            FROM char_skills
            WHERE character_id = ${character.id}
            GROUP BY skill
          )
          ORDER BY skill
        `

        const formData = new FormData()
        for (const skill of currentSkills) {
          formData.append(`${skill.skill}_proficiency`, skill.proficiency)
        }

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/skills`,
          {
            user,
            method: "POST",
            body: formData,
          }
        )

        expect(response.status).toBe(200)
        const html = await response.text()
        expect(html).toContain("Must change at least one skill")
      })
    })
  })
})

describe("GET /characters/:id/history/skills", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/characters/test-id/history/skills")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User
    let character: Character

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
      character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    })

    test("returns status 200", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/history/skills`,
        { user }
      )

      expect(response.status).toBe(200)
    })

    test("renders the skills history modal with title", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/history/skills`,
        { user }
      )

      const document = await parseHtml(response)
      const title = expectElement(document, ".modal-title")
      expect(title.textContent).toBe("Skills History")
    })

    describe("with skill changes", () => {
      beforeEach(async () => {
        // Create some skill history (use future timestamps to be after factory-created skills)
        await testCtx.db`
          INSERT INTO char_skills (id, character_id, skill, proficiency, note, created_at, updated_at)
          VALUES
            ('skill-1', ${character.id}, 'acrobatics', 'none', 'Initial', NOW() + INTERVAL '1 second', NOW()),
            ('skill-2', ${character.id}, 'acrobatics', 'proficient', 'Trained', NOW() + INTERVAL '2 seconds', NOW()),
            ('skill-3', ${character.id}, 'stealth', 'none', 'Initial', NOW() + INTERVAL '1 second', NOW()),
            ('skill-4', ${character.id}, 'stealth', 'expert', 'Mastered', NOW() + INTERVAL '2 seconds', NOW())
        `
      })

      test("displays history table with correct headers", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/skills`,
          { user }
        )

        const document = await parseHtml(response)
        const table = expectElement(document, "table")
        const headers = table.querySelectorAll("th")

        const headerTexts = Array.from(headers).map((h) => h.textContent?.trim())
        expect(headerTexts).toContain("Date")
        expect(headerTexts).toContain("Skill")
        expect(headerTexts).toContain("Proficiency")
        expect(headerTexts).toContain("Note")
      })

      test("displays all skill changes in table rows", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/skills`,
          { user }
        )

        const document = await parseHtml(response)
        const rows = document.querySelectorAll("tbody tr")

        // Should have 4 history entries
        expect(rows.length).toBeGreaterThanOrEqual(4)
      })

      test("displays proficiency icons", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/skills`,
          { user }
        )

        const document = await parseHtml(response)
        const icons = document.querySelectorAll("i.bi")

        // Should have proficiency icons for each entry
        expect(icons.length).toBeGreaterThan(0)
      })

      test("displays notes in table", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/skills`,
          { user }
        )

        const html = await response.text()
        expect(html).toContain("Initial")
        expect(html).toContain("Trained")
        expect(html).toContain("Mastered")
      })

      test("shows most recent changes first", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/skills`,
          { user }
        )

        const html = await response.text()
        const trainedIndex = html.indexOf("Trained")
        const initialIndex = html.indexOf("Initial")

        // "Trained" should appear before "Initial" in the HTML
        expect(trainedIndex).toBeLessThan(initialIndex)
      })

      test("groups simultaneous changes with rowspan", async () => {
        // Add simultaneous changes (same timestamp and note)
        const now = new Date()
        await testCtx.db`
          INSERT INTO char_skills (id, character_id, skill, proficiency, note, created_at, updated_at)
          VALUES
            ('skill-5', ${character.id}, 'perception', 'proficient', 'Bulk update', ${now}, ${now}),
            ('skill-6', ${character.id}, 'investigation', 'half', 'Bulk update', ${now}, ${now})
        `

        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/skills`,
          { user }
        )

        const document = await parseHtml(response)
        const rowspanCells = document.querySelectorAll("td[rowspan]")

        // Should have at least one rowspan for grouped changes
        expect(rowspanCells.length).toBeGreaterThan(0)

        // Verify "Bulk update" appears in one of the rowspan cells (the note column)
        const rowspanTexts = Array.from(rowspanCells).map((cell) => cell.textContent || "")
        expect(rowspanTexts.some((text) => text.includes("Bulk update"))).toBe(true)
      })
    })

    describe("with no skill changes", () => {
      beforeEach(async () => {
        // Delete initial skills
        await testCtx.db`
          DELETE FROM char_skills WHERE character_id = ${character.id}
        `
      })

      test("shows no history message", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/history/skills`,
          { user }
        )

        const html = await response.text()
        expect(html).toContain("No skills history")
      })
    })
  })
})
