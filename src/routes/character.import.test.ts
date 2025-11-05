import { beforeEach, describe, expect, test } from "bun:test"
import { findByCharacterId as findAbilities } from "@src/db/char_abilities"
import { findByCharacterId as findLevels } from "@src/db/char_levels"
import { findByCharacterId as findSkills } from "@src/db/char_skills"
import { findByCharacterId as findTraits } from "@src/db/char_traits"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { userFactory } from "@src/test/factories/user"
import { expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("GET /characters/import", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const response = await makeRequest(testCtx.app, "/characters/import")

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    test("renders the import form", async () => {
      const response = await makeRequest(testCtx.app, "/characters/import", { user })
      const document = await parseHtml(response)

      expect(response.status).toBe(200)
      expectElement(document, 'input[name="name"]')
      expectElement(document, 'select[name="species"]')
      expectElement(document, 'input[name="max_hp"]')
    })
  })
})

describe("POST /characters/import", () => {
  const testCtx = useTestApp()

  describe("when user is not authenticated", () => {
    test("redirects to login page", async () => {
      const formData = new FormData()
      formData.append("name", "Test Character")

      const response = await makeRequest(testCtx.app, "/characters/import", {
        method: "POST",
        body: formData,
      })

      expect(response.status).toBe(302)
      expect(response.headers.get("Location")).toContain("/login")
    })
  })

  describe("when user is authenticated", () => {
    let user: User

    beforeEach(async () => {
      user = await userFactory.create({}, testCtx.db)
    })

    describe("with validation errors", () => {
      test("shows error when name is missing", async () => {
        const formData = new FormData()
        formData.append("is_check", "false")

        const response = await makeRequest(testCtx.app, "/characters/import", {
          method: "POST",
          body: formData,
          user,
        })

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const errorText = document.querySelector(".invalid-feedback")?.textContent || ""
        expect(errorText).toContain("Character name is required")
      })

      test("shows error when name is too short", async () => {
        const formData = new FormData()
        formData.append("name", "AB")
        formData.append("is_check", "false")

        const response = await makeRequest(testCtx.app, "/characters/import", {
          method: "POST",
          body: formData,
          user,
        })

        expect(response.status).toBe(200)
        const document = await parseHtml(response)
        const errorText = document.querySelector(".invalid-feedback")?.textContent || ""
        expect(errorText).toContain("at least 3 characters")
      })

      test("shows error when no classes selected", async () => {
        const formData = new FormData()
        formData.append("name", "Test Character")
        formData.append("species", "human")
        formData.append("background", "acolyte")
        formData.append("ruleset", "srd51")
        formData.append("max_hp", "10")
        formData.append("ability_strength", "10")
        formData.append("ability_dexterity", "10")
        formData.append("ability_constitution", "10")
        formData.append("ability_intelligence", "10")
        formData.append("ability_wisdom", "10")
        formData.append("ability_charisma", "10")
        formData.append("is_check", "false")

        const response = await makeRequest(testCtx.app, "/characters/import", {
          method: "POST",
          body: formData,
          user,
        })

        expect(response.status).toBe(200)
        const text = await response.text()
        expect(text).toContain("must select at least one class")
      })

      test("shows error when max HP is missing", async () => {
        const formData = new FormData()
        formData.append("name", "Test Character")
        formData.append("species", "human")
        formData.append("background", "acolyte")
        formData.append("ruleset", "srd51")
        formData.append("classes_fighter", "on")
        formData.append("levels_fighter", "1")
        formData.append("ability_strength", "10")
        formData.append("ability_dexterity", "10")
        formData.append("ability_constitution", "10")
        formData.append("ability_intelligence", "10")
        formData.append("ability_wisdom", "10")
        formData.append("ability_charisma", "10")
        formData.append("is_check", "false")

        const response = await makeRequest(testCtx.app, "/characters/import", {
          method: "POST",
          body: formData,
          user,
        })

        expect(response.status).toBe(200)
        const text = await response.text()
        expect(text).toContain("Max HP is required")
      })
    })

    describe("with valid single-class import", () => {
      test("creates character with all data", async () => {
        const formData = new FormData()
        formData.append("name", "Imported Fighter")
        formData.append("species", "human")
        formData.append("background", "acolyte")
        formData.append("ruleset", "srd51")
        formData.append("alignment", "Lawful Good")
        formData.append("classes_fighter", "on")
        formData.append("levels_fighter", "5")
        formData.append("subclass_fighter", "champion")
        formData.append("ability_strength", "16")
        formData.append("ability_dexterity", "14")
        formData.append("ability_constitution", "15")
        formData.append("ability_intelligence", "10")
        formData.append("ability_wisdom", "12")
        formData.append("ability_charisma", "8")
        formData.append("save_strength", "on")
        formData.append("save_constitution", "on")
        formData.append("max_hp", "42")
        formData.append("athletics_proficiency", "proficient")
        formData.append("intimidation_proficiency", "proficient")
        formData.append("is_check", "false")

        const response = await makeRequest(testCtx.app, "/characters/import", {
          method: "POST",
          body: formData,
          user,
        })

        // Should redirect to character sheet
        expect(response.status).toBe(204)
        const redirectUrl = response.headers.get("HX-Redirect")
        expect(redirectUrl).toMatch(/\/characters\/[a-zA-Z0-9]+/)

        // Extract character ID from redirect URL
        const characterId = redirectUrl!.split("/").pop()!

        // Verify character record
        const charResult = await testCtx.db`SELECT * FROM characters WHERE id = ${characterId}`
        expect(charResult.length).toBe(1)
        const character = charResult[0]!
        expect(character.name).toBe("Imported Fighter")
        expect(character.species).toBe("human")
        expect(character.background).toBe("acolyte")
        expect(character.alignment).toBe("Lawful Good")

        // Verify ability scores (6 base + 2 saving throws)
        const abilities = await findAbilities(testCtx.db, characterId)
        expect(abilities.length).toBeGreaterThanOrEqual(8) // 6 base + 2 saves

        const strAbility = abilities.find((a) => a.ability === "strength" && !a.proficiency)
        expect(strAbility?.score).toBe(16)

        const strSave = abilities.find((a) => a.ability === "strength" && a.proficiency)
        expect(strSave).toBeDefined()

        // Verify skill proficiencies (only proficient skills)
        const skills = await findSkills(testCtx.db, characterId)
        const proficientSkills = skills.filter((s) => s.proficiency !== "none")
        expect(proficientSkills.length).toBeGreaterThanOrEqual(2)

        const athletics = skills.find((s) => s.skill === "athletics")
        expect(athletics?.proficiency).toBe("proficient")

        // Verify levels (should have 5 levels)
        const levels = await findLevels(testCtx.db, characterId)
        expect(levels.length).toBe(5)
        expect(levels.every((l) => l.class === "fighter")).toBe(true)

        // Verify total HP from levels equals max HP
        const totalHp = levels.reduce((sum, l) => sum + l.hit_die_roll, 0)
        expect(totalHp).toBe(42)

        // Verify traits exist (species, background, class)
        const traits = await findTraits(testCtx.db, characterId)
        expect(traits.length).toBeGreaterThan(0)

        const speciesTraits = traits.filter((t) => t.source === "species")
        expect(speciesTraits.length).toBeGreaterThan(0)

        const backgroundTraits = traits.filter((t) => t.source === "background")
        expect(backgroundTraits.length).toBeGreaterThan(0)

        const classTraits = traits.filter((t) => t.source === "class")
        expect(classTraits.length).toBeGreaterThan(0)
      })
    })

    describe("with multi-class import", () => {
      test("creates levels for multiple classes", async () => {
        const formData = new FormData()
        formData.append("name", "Fighter/Rogue")
        formData.append("species", "human")
        formData.append("background", "criminal")
        formData.append("ruleset", "srd51")
        formData.append("classes_fighter", "on")
        formData.append("levels_fighter", "3")
        formData.append("subclass_fighter", "champion")
        formData.append("classes_rogue", "on")
        formData.append("levels_rogue", "2")
        formData.append("ability_strength", "15")
        formData.append("ability_dexterity", "16")
        formData.append("ability_constitution", "14")
        formData.append("ability_intelligence", "10")
        formData.append("ability_wisdom", "12")
        formData.append("ability_charisma", "8")
        formData.append("max_hp", "35")
        formData.append("athletics_proficiency", "proficient")
        formData.append("stealth_proficiency", "proficient")
        formData.append("is_check", "false")

        const response = await makeRequest(testCtx.app, "/characters/import", {
          method: "POST",
          body: formData,
          user,
        })

        expect(response.status).toBe(204)
        const redirectUrl = response.headers.get("HX-Redirect")
        const characterId = redirectUrl!.split("/").pop()!

        // Verify 5 total levels (3 fighter + 2 rogue)
        const levels = await findLevels(testCtx.db, characterId)
        expect(levels.length).toBe(5)

        const fighterLevels = levels.filter((l) => l.class === "fighter")
        expect(fighterLevels.length).toBe(3)

        const rogueLevels = levels.filter((l) => l.class === "rogue")
        expect(rogueLevels.length).toBe(2)

        // Verify HP totals correctly
        const totalHp = levels.reduce((sum, l) => sum + l.hit_die_roll, 0)
        expect(totalHp).toBe(35)

        // Verify traits from both classes exist
        const traits = await findTraits(testCtx.db, characterId)
        const fighterTraits = traits.filter(
          (t) => t.source === "class" && t.source_detail === "fighter"
        )
        const rogueTraits = traits.filter(
          (t) => t.source === "class" && t.source_detail === "rogue"
        )

        expect(fighterTraits.length).toBeGreaterThan(0)
        expect(rogueTraits.length).toBeGreaterThan(0)
      })
    })

    describe("with custom background", () => {
      test("creates character with custom background name", async () => {
        const formData = new FormData()
        formData.append("name", "Custom Background Character")
        formData.append("species", "elf")
        formData.append("lineage", "high elf")
        formData.append("background", "_custom")
        formData.append("custom_background", "Guild Merchant")
        formData.append("ruleset", "srd51")
        formData.append("classes_wizard", "on")
        formData.append("levels_wizard", "1")
        formData.append("ability_strength", "8")
        formData.append("ability_dexterity", "14")
        formData.append("ability_constitution", "12")
        formData.append("ability_intelligence", "16")
        formData.append("ability_wisdom", "10")
        formData.append("ability_charisma", "13")
        formData.append("max_hp", "8")
        formData.append("arcana_proficiency", "proficient")
        formData.append("is_check", "false")

        const response = await makeRequest(testCtx.app, "/characters/import", {
          method: "POST",
          body: formData,
          user,
        })

        expect(response.status).toBe(204)
        const redirectUrl = response.headers.get("HX-Redirect")
        const characterId = redirectUrl!.split("/").pop()!

        // Verify character has custom background
        const charResult = await testCtx.db`SELECT * FROM characters WHERE id = ${characterId}`
        expect(charResult[0]!.background).toBe("Guild Merchant")

        // Verify no background traits created (since custom)
        const traits = await findTraits(testCtx.db, characterId)
        const backgroundTraits = traits.filter(
          (t) => t.source === "background" && t.source_detail === "Guild Merchant"
        )
        expect(backgroundTraits.length).toBe(0)
      })
    })

    describe("HP distribution", () => {
      test("distributes HP with remainder to last levels", async () => {
        const formData = new FormData()
        formData.append("name", "HP Test Character")
        formData.append("species", "human")
        formData.append("background", "soldier")
        formData.append("ruleset", "srd51")
        formData.append("classes_fighter", "on")
        formData.append("levels_fighter", "7")
        formData.append("subclass_fighter", "champion")
        formData.append("ability_strength", "16")
        formData.append("ability_dexterity", "14")
        formData.append("ability_constitution", "15")
        formData.append("ability_intelligence", "10")
        formData.append("ability_wisdom", "12")
        formData.append("ability_charisma", "8")
        formData.append("max_hp", "52") // 52 / 7 = 7 remainder 3
        formData.append("athletics_proficiency", "proficient")
        formData.append("is_check", "false")

        const response = await makeRequest(testCtx.app, "/characters/import", {
          method: "POST",
          body: formData,
          user,
        })

        expect(response.status).toBe(204)
        const redirectUrl = response.headers.get("HX-Redirect")
        const characterId = redirectUrl!.split("/").pop()!

        const levels = await findLevels(testCtx.db, characterId)
        expect(levels.length).toBe(7)

        // Total should equal max HP
        const totalHp = levels.reduce((sum, l) => sum + l.hit_die_roll, 0)
        expect(totalHp).toBe(52)

        // First 4 levels should have 7 HP, last 3 should have 8 HP (7 + 1 from remainder)
        const hpValues = levels.map((l) => l.hit_die_roll)
        const base7Count = hpValues.filter((hp) => hp === 7).length
        const plus1Count = hpValues.filter((hp) => hp === 8).length

        expect(base7Count).toBe(4)
        expect(plus1Count).toBe(3)
      })
    })

    describe("skill proficiency levels", () => {
      test("creates skills with different proficiency levels", async () => {
        const formData = new FormData()
        formData.append("name", "Skill Test Character")
        formData.append("species", "human")
        formData.append("background", "sage")
        formData.append("ruleset", "srd51")
        formData.append("classes_bard", "on")
        formData.append("levels_bard", "1")
        formData.append("ability_strength", "8")
        formData.append("ability_dexterity", "14")
        formData.append("ability_constitution", "12")
        formData.append("ability_intelligence", "13")
        formData.append("ability_wisdom", "10")
        formData.append("ability_charisma", "16")
        formData.append("max_hp", "8")
        formData.append("acrobatics_proficiency", "proficient")
        formData.append("performance_proficiency", "expert")
        formData.append("stealth_proficiency", "half")
        formData.append("athletics_proficiency", "none")
        formData.append("is_check", "false")

        const response = await makeRequest(testCtx.app, "/characters/import", {
          method: "POST",
          body: formData,
          user,
        })

        expect(response.status).toBe(204)
        const redirectUrl = response.headers.get("HX-Redirect")
        const characterId = redirectUrl!.split("/").pop()!

        const skills = await findSkills(testCtx.db, characterId)

        const acrobatics = skills.find((s) => s.skill === "acrobatics")
        expect(acrobatics?.proficiency).toBe("proficient")

        const performance = skills.find((s) => s.skill === "performance")
        expect(performance?.proficiency).toBe("expert")

        const stealth = skills.find((s) => s.skill === "stealth")
        expect(stealth?.proficiency).toBe("half")

        // "none" proficiency should not create a record
        const athletics = skills.find((s) => s.skill === "athletics")
        expect(athletics).toBeUndefined()
      })
    })
  })
})
