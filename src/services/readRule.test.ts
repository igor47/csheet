import { beforeEach, describe, expect, test } from "bun:test"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { type ComputedCharacter, computeCharacter } from "./computeCharacter"
import { executeReadRule } from "./readRule"

describe("executeReadRule", () => {
  const testCtx = useTestApp()
  let char: ComputedCharacter

  beforeEach(async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create(
      { user_id: user.id, ruleset: "srd52" },
      testCtx.db
    )
    const computed = await computeCharacter(testCtx.db, character.id)
    if (!computed) throw new Error("Character not found")
    char = computed
  })

  test("returns a section's full text and link", async () => {
    const result = await executeReadRule(testCtx.db, char, {
      section_id: "spells/spell-descriptions/fireball",
    })

    expect(result.complete).toBe(true)
    if (!result.complete) return
    expect(result.result.title).toBe("Fireball")
    expect(result.result.location).toBe("Spells > Spell Descriptions > Fireball")
    expect(result.result.text).toContain("8d6")
    expect(result.result.truncated).toBe(false)
    expect(result.result.child_sections).toEqual([])
    expect(result.result.url).toStartWith("/rules?ruleset=srd52&section=")
  })

  test("returns a chapter's intro and its child sections", async () => {
    const result = await executeReadRule(testCtx.db, char, { section_id: "spells" })

    expect(result.complete).toBe(true)
    if (!result.complete) return
    expect(result.result.child_sections.map((c) => c.title)).toContain("Spell Descriptions")
    expect(result.result.text).not.toContain("Fireball")
  })

  test("follows a single-monster wrapper to the monster", async () => {
    const result = await executeReadRule(testCtx.db, char, { section_id: "monsters-a-z/aboleth" })

    expect(result.complete).toBe(true)
    if (!result.complete) return
    expect(result.result.id).toBe("monsters-a-z/aboleth/aboleth")
    expect(result.result.text).toContain("#### Actions")
  })

  test("points to search_rules for an unknown id", async () => {
    const result = await executeReadRule(testCtx.db, char, { section_id: "no/such/section" })

    expect(result.complete).toBe(false)
    if (result.complete) return
    expect(result.errors.section_id).toContain("search_rules")
  })
})
