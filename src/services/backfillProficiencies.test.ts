import { beforeEach, describe, expect, test } from "bun:test"
import { findByCharacterId as findProficiencyEvents } from "@src/db/char_proficiencies"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { addLevel } from "./addLevel"
import { BACKFILL_NOTE, backfillCharacterProficiencies } from "./backfillProficiencies"
import { computeCharacter } from "./computeCharacter"

describe("backfillCharacterProficiencies", () => {
  const testCtx = useTestApp()
  let user: User
  let character: Character

  async function names(kind: string) {
    const char = await computeCharacter(testCtx.db, character.id)
    return char!.proficiencies.filter((p) => p.kind === kind).map((p) => p.name)
  }

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
    // legacy: levels written directly, no proficiency rows, the way characters were stored before
    character = await characterFactory.create(
      {
        user_id: user.id,
        class: "wizard",
        level: 2,
        species: "dwarf",
        background: "sage",
        legacy: true,
      },
      testCtx.db
    )
  })

  test("grants a legacy character's species, background, and class proficiencies", async () => {
    await backfillCharacterProficiencies(testCtx.db, character)

    expect(await names("weapon")).toEqual(expect.arrayContaining(["dagger", "battleaxe"]))
    expect(await names("language")).toEqual(["common", "dwarvish"])
    const events = await findProficiencyEvents(testCtx.db, character.id)
    expect(events.find((e) => e.name === "dagger")).toMatchObject({
      source: "class",
      source_detail: "wizard",
      note: BACKFILL_NOTE,
    })
  })

  test("grants nothing the second time", async () => {
    await backfillCharacterProficiencies(testCtx.db, character)
    expect(await backfillCharacterProficiencies(testCtx.db, character)).toEqual([])
  })

  describe("after multiclassing into fighter before the backfill", () => {
    beforeEach(async () => {
      const result = await addLevel(testCtx.db, character, { class: "fighter", hit_die_roll: "6" })
      expect(result.complete).toBe(true)
    })

    test("still gets the wizard's proficiencies, and not the fighter's full set", async () => {
      await backfillCharacterProficiencies(testCtx.db, character)

      expect(await names("weapon")).toEqual(
        expect.arrayContaining(["dagger", "quarterstaff", "martial weapons"])
      )
      expect(await names("armor")).not.toContain("heavy armor")
    })
  })
})
