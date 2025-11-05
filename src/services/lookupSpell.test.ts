import { describe, expect, test } from "bun:test"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { computeCharacter } from "./computeCharacter"
import { executeLookupSpell } from "./lookupSpell"

describe("executeLookupSpell", () => {
  const testCtx = useTestApp()

  test("finds spell by exact name match", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupSpell(testCtx.db, computedChar, {
      spell_name: "Fireball",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return
    expect(result.result).toBeTruthy()
    expect(result.result.name).toBe("Fireball")
    expect(result.result.level).toBe(3)
    expect(result.result.school).toBe("evocation")
    expect(result.result.description).toBeTruthy()
  })

  test("finds spell with case-insensitive match", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupSpell(testCtx.db, computedChar, {
      spell_name: "fireball",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return
    expect(result.result.name).toBe("Fireball")
  })

  test("finds spell by partial name match", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupSpell(testCtx.db, computedChar, {
      spell_name: "magic miss",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return
    expect(result.result.name).toBe("Magic Missile")
  })

  test("returns error when spell not found", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupSpell(testCtx.db, computedChar, {
      spell_name: "NonexistentSpell",
    })

    expect(result.complete).toBe(false)
    if (result.complete !== false) return
    expect(result.errors.spell_name).toContain("No spell found matching")
  })

  test("returns error when multiple spells match", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    // "Acid" matches both "Acid Splash" and "Acid Arrow"
    const result = await executeLookupSpell(testCtx.db, computedChar, {
      spell_name: "Acid",
    })

    expect(result.complete).toBe(false)
    if (result.complete !== false) return
    expect(result.errors.spell_name).toContain("Multiple spells match")
    expect(result.errors.spell_name).toContain("Acid")
  })

  test("includes all spell details in response", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupSpell(testCtx.db, computedChar, {
      spell_name: "Shield",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return

    const spell = result.result
    expect(spell).toBeTruthy()
    expect(spell?.id).toBeTruthy()
    expect(spell?.name).toBe("Shield")
    expect(spell?.level).toBe(1)
    expect(spell?.school).toBeTruthy()
    expect(spell?.description).toBeTruthy()
    expect(spell?.castingTime).toBeTruthy()
    expect(spell?.range).toBeTruthy()
    expect(spell?.components).toBeTruthy()
    expect(spell?.duration).toBeTruthy()
    expect(spell?.classes).toBeTruthy()
    expect(Array.isArray(spell?.classes)).toBe(true)
  })

  test("returns error for invalid parameters", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupSpell(testCtx.db, computedChar, {
      // Missing spell_name parameter
    })

    expect(result.complete).toBe(false)
    if (result.complete !== false) return
    expect(result.errors.spell_name).toContain("Invalid input")
  })

  test("handles empty spell name", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupSpell(testCtx.db, computedChar, {
      spell_name: "",
    })

    expect(result.complete).toBe(false)
    if (result.complete !== false) return
    // Empty string matches all spells, so we get "Multiple spells match"
    expect(result.errors.spell_name).toContain("Multiple spells match")
  })

  test("handles spell name with extra whitespace", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    const computedChar = await computeCharacter(testCtx.db, character.id)
    if (!computedChar) throw new Error("Character not found")

    const result = await executeLookupSpell(testCtx.db, computedChar, {
      spell_name: "  Fireball  ",
    })

    expect(result.complete).toBe(true)
    if (result.complete !== true) return
    expect(result.result.name).toBe("Fireball")
  })
})
