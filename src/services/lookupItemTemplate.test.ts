import { describe, expect, test } from "bun:test"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { computeCharacter } from "./computeCharacter"
import { executeLookupItemTemplate } from "./lookupItemTemplate"

describe("executeLookupItemTemplate", () => {
  const testCtx = useTestApp()

  test("finds item by exact name match", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      template_name: "Longsword",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return
    expect(result.result.matching_items).toBeTruthy()
    expect(Array.isArray(result.result.matching_items)).toBe(true)
    expect(result.result.matching_items.length).toBe(1)
    const template = result.result.matching_items[0]
    if (!template) throw new Error("Template not found")
    expect(template.name).toBe("Longsword")
    expect(template.category).toBe("weapon")
  })

  test("finds item with case-insensitive match", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      template_name: "longsword",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return
    expect(result.result.matching_items.length).toBe(1)
    const template = result.result.matching_items[0]
    if (!template) throw new Error("Template not found")
    expect(template.name).toBe("Longsword")
  })

  test("finds multiple items by partial name match", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    // "sword" matches multiple items (Longsword, Shortsword, Greatsword, etc)
    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      template_name: "sword",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return
    expect(result.result.matching_items).toBeTruthy()
    expect(Array.isArray(result.result.matching_items)).toBe(true)
    expect(result.result.matching_items.length).toBeGreaterThan(1)
    // Check that all results contain "sword" in the name
    for (const template of result.result.matching_items) {
      expect(template.name.toLowerCase()).toContain("sword")
    }
  })

  test("filters by category when provided", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    // Search for "shield" in weapon category should fail
    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      template_name: "shield",
      category: "weapon",
    })

    expect(result.complete).toBe(false)
    if (result.complete !== false) return
    expect(result.errors.template_name).toContain("No item template found")
    expect(result.errors.template_name).toContain('category "weapon"')
  })

  test("finds shield when filtering by shield category", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      template_name: "shield",
      category: "shield",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return
    expect(result.result.matching_items.length).toBe(1)
    const template = result.result.matching_items[0]
    if (!template) throw new Error("Template not found")
    expect(template.name).toBe("Shield")
    expect(template.category).toBe("shield")
  })

  test("returns error when item not found", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      template_name: "NonexistentItem",
    })

    expect(result.complete).toBe(false)
    if (result.complete !== false) return
    expect(result.errors.template_name).toContain("No item template found matching")
  })

  test("includes weapon details in response", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      template_name: "Longsword",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return

    const template = result.result.matching_items[0]
    if (!template) throw new Error("Template not found")
    expect(template.name).toBe("Longsword")
    expect(template.category).toBe("weapon")
    expect(template.weapon_type).toBe("melee")
    expect(template.damage).toBeTruthy()
    expect(Array.isArray(template.damage)).toBe(true)
    if (template.damage && template.damage.length > 0) {
      const damage = template.damage[0]
      if (!damage) throw new Error("Damage not found")
      expect(damage.num_dice).toBeTruthy()
      expect(damage.die_value).toBeTruthy()
      expect(damage.type).toBeTruthy()
    }
  })

  test("includes armor details in response", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      template_name: "Chain Mail",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return

    const template = result.result.matching_items[0]
    if (!template) throw new Error("Template not found")
    expect(template.name).toBe("Chain mail")
    expect(template.category).toBe("armor")
    expect(template.armor_type).toBeTruthy()
    expect(template.armor_class).toBeTruthy()
    expect(typeof template.armor_class).toBe("number")
  })

  test("includes shield details in response", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      template_name: "Shield",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return

    const template = result.result.matching_items[0]
    if (!template) throw new Error("Template not found")
    expect(template.name).toBe("Shield")
    expect(template.category).toBe("shield")
    expect(template.armor_modifier).toBeTruthy()
    expect(typeof template.armor_modifier).toBe("number")
  })

  test("returns error for invalid parameters", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      // Missing template_name parameter
    })

    expect(result.complete).toBe(false)
    if (result.complete !== false) return
    expect(result.errors.template_name).toBeTruthy()
  })

  test("returns multiple matches for empty string", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      template_name: "",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return
    // Empty string matches all items
    expect(result.result.matching_items.length).toBeGreaterThan(10)
  })

  test("handles template name with extra whitespace", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      template_name: "  Longsword  ",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return
    expect(result.result.matching_items.length).toBe(1)
    const template = result.result.matching_items[0]
    if (!template) throw new Error("Template not found")
    expect(template.name).toBe("Longsword")
  })

  test("uses character's ruleset for template lookup", async () => {
    const user = await userFactory.create({}, testCtx.db)
    // Create character with srd51 ruleset (default)
    const character = await characterFactory.create(
      { user_id: user.id, ruleset: "srd51" },
      testCtx.db
    )
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupItemTemplate(testCtx.db, computedChar, {
      template_name: "Longsword",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return
    expect(result.result.matching_items.length).toBe(1)
    const template = result.result.matching_items[0]
    if (!template) throw new Error("Template not found")
    expect(template.name).toBe("Longsword")
    // The template should be from srd51 (which is the default)
  })
})
