import { beforeEach, describe, expect, test } from "bun:test"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { type ComputedCharacter, computeCharacter } from "./computeCharacter"
import { executeSearchRules } from "./searchRules"

describe("executeSearchRules", () => {
  const testCtx = useTestApp()

  async function createCharacter(ruleset: "srd51" | "srd52"): Promise<ComputedCharacter> {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create({ user_id: user.id, ruleset }, testCtx.db)
    const computed = await computeCharacter(testCtx.db, character.id)
    if (!computed) throw new Error("Character not found")
    return computed
  }

  describe("for an SRD 5.2 character", () => {
    let char: ComputedCharacter

    beforeEach(async () => {
      char = await createCharacter("srd52")
    })

    test("ranks the section titled with the query first", async () => {
      const result = await executeSearchRules(testCtx.db, char, { query: "grappled" })

      expect(result.complete).toBe(true)
      if (!result.complete) return
      const [top] = result.result.results
      expect(top?.location).toBe("Rules Glossary > Rules Definitions > Grappled [Condition]")
      expect(top?.excerpt).toContain("Speed")
      expect(top?.url).toBe(`/rules?ruleset=srd52&section=${encodeURIComponent(top!.id)}`)
    })

    test("finds sections from words in their text", async () => {
      const result = await executeSearchRules(testCtx.db, char, { query: "opportunity attack" })

      expect(result.complete).toBe(true)
      if (!result.complete) return
      expect(result.result.results.length).toBeGreaterThan(1)
      expect(result.result.results.length).toBeLessThanOrEqual(8)
      expect(result.result.results[0]?.location).toContain("Opportunity Attack")
    })

    test("reports when nothing matches", async () => {
      const result = await executeSearchRules(testCtx.db, char, { query: "xyzzyplugh" })

      expect(result.complete).toBe(false)
      if (result.complete) return
      expect(result.errors.query).toContain("No rules matched")
    })

    test("rejects an empty query", async () => {
      const result = await executeSearchRules(testCtx.db, char, { query: "" })
      expect(result.complete).toBe(false)
    })
  })

  describe("for an SRD 5.1 character", () => {
    test("searches the 5.1 rules", async () => {
      const char = await createCharacter("srd51")
      const result = await executeSearchRules(testCtx.db, char, { query: "long rest" })

      expect(result.complete).toBe(true)
      if (!result.complete) return
      expect(result.result.ruleset).toBe("srd51")
      expect(result.result.results[0]?.location).toBe("Resting > Long Rest")
    })
  })
})
