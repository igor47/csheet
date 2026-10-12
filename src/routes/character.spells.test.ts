import { beforeEach, describe, expect, test } from "bun:test"
import { create as createSpellLearned } from "@src/db/char_spells_learned"
import { create as createSpellPrepared } from "@src/db/char_spells_prepared"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import type { ClassNameType } from "@src/lib/dnd"
import type { RulesetId } from "@src/lib/dnd/rulesets"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { SRD52_ID } from "@src/lib/dnd/srd52"
import { computeCharacter } from "@src/services/computeCharacter"
import { executeLookupSpell } from "@src/services/lookupSpell"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { elementExists, expectElement, getElements, makeRequest, parseHtml } from "@src/test/http"
import type { SQL } from "bun"

describe("spells in a character's ruleset", () => {
  const testCtx = useTestApp()

  let user: User
  let character: Character

  async function createCaster(ruleset: RulesetId, cls: ClassNameType) {
    character = await characterFactory.create(
      {
        user_id: user.id,
        ruleset,
        class: cls,
        level: 3,
        intelligence: 16,
        wisdom: 16,
        charisma: 16,
      },
      testCtx.db
    )
  }

  function post(path: string, fields: Record<string, string>) {
    return makeRequest(testCtx.app, `/characters/${character.id}${path}`, {
      user,
      method: "POST",
      headers: {
        "HX-Request": "true",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams(fields).toString(),
    })
  }

  /** Puts a spell in a slot directly, the way spells got there before catalogs were per ruleset */
  async function prepareDirectly(db: SQL, cls: ClassNameType, spellId: string) {
    await createSpellPrepared(db, {
      character_id: character.id,
      class: cls,
      spell_id: spellId,
      action: "prepare",
      always_prepared: false,
      note: null,
    })
  }

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
  })

  describe("an SRD 5.1 warlock", () => {
    beforeEach(async () => {
      await createCaster(SRD51_ID, "warlock")
    })

    test("can't prepare Hex, which is only in SRD 5.2", async () => {
      const response = await post("/edit/prepspell", {
        class: "warlock",
        spell_type: "spell",
        spell_id: "srd_hex",
      })
      const body = (await parseHtml(response)).body.textContent || ""

      expect(body).toContain("Hex isn't part of SRD 5.1")
      const char = await computeCharacter(testCtx.db, character.id)
      const warlock = char!.spells.find((s) => s.class === "warlock")!
      expect(warlock.preparedSpells.map((s) => s.spell_id)).not.toContain("srd_hex")
    })

    test("isn't offered Hex in the prepare form", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/edit/prepspell?class=warlock&spell_type=spell`,
        { user }
      )
      const document = await parseHtml(response)

      expect(elementExists(document, "#spell-srd_hex")).toBe(false)
      expect(elementExists(document, "#spell-srd_hellish_rebuke")).toBe(true)
    })

    describe("with Hex prepared before spells were split by ruleset", () => {
      beforeEach(async () => {
        await prepareDirectly(testCtx.db, "warlock", "srd_hex")
      })

      test("still shows Hex on the sheet, flagged as SRD 5.2.1", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
        expect(response.status).toBe(200)

        const document = await parseHtml(response)
        const panel = document.querySelector("#spells-panel")!
        expect(panel.textContent).toContain("Hex")
        const badges = getElements(document, "#spells-panel .spell-issue-badge")
        expect(badges).toHaveLength(1)
        expect(badges[0]!.textContent).toBe("SRD 5.2.1")
        expect(badges[0]!.getAttribute("title")).toContain("Hex is from SRD 5.2.1, not SRD 5.1.")
      })

      test("links Hex to its details in the character's ruleset, flagged there too", async () => {
        const sheet = await parseHtml(
          await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
        )
        const link = getElements(sheet, "#spells-panel a").find((a) => a.textContent === "Hex")
        const href = link?.getAttribute("hx-get")
        expect(href).toBe("/spells/srd_hex?ruleset=srd51")

        const response = await makeRequest(testCtx.app, href!, {
          headers: { "HX-Request": "true" },
        })
        const document = await parseHtml(response)

        expect(document.querySelector(".modal-title")?.textContent).toContain("Hex")
        expect(elementExists(document, ".modal-title .spell-issue-badge")).toBe(true)
      })

      test("can swap Hex out for a 5.1 spell", async () => {
        await post("/edit/prepspell", {
          class: "warlock",
          spell_type: "spell",
          spell_id: "srd_hellish_rebuke",
          current_spell_id: "srd_hex",
        })

        const char = await computeCharacter(testCtx.db, character.id)
        const warlock = char!.spells.find((s) => s.class === "warlock")!
        const prepared = warlock.preparedSpells.map((s) => s.spell_id)
        expect(prepared).toContain("srd_hellish_rebuke")
        expect(prepared).not.toContain("srd_hex")
      })
    })

    describe("with a spell id that's in neither catalog", () => {
      beforeEach(async () => {
        await prepareDirectly(testCtx.db, "warlock", "srd_no_such_spell")
      })

      test("leaves the slot free instead of failing", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
        expect(response.status).toBe(200)

        const char = await computeCharacter(testCtx.db, character.id)
        const warlock = char!.spells.find((s) => s.class === "warlock")!
        expect(warlock.preparedSpells.map((s) => s.spell_id)).not.toContain("srd_no_such_spell")
      })
    })
  })

  describe("an SRD 5.2 warlock", () => {
    beforeEach(async () => {
      await createCaster(SRD52_ID, "warlock")
    })

    test("can prepare Hex", async () => {
      await post("/edit/prepspell", { class: "warlock", spell_type: "spell", spell_id: "srd_hex" })

      const char = await computeCharacter(testCtx.db, character.id)
      const warlock = char!.spells.find((s) => s.class === "warlock")!
      expect(warlock.preparedSpells.map((s) => s.spell_id)).toContain("srd_hex")
    })
  })

  describe("an SRD 5.1 wizard", () => {
    beforeEach(async () => {
      await createCaster(SRD51_ID, "wizard")
    })

    test("can't add Chromatic Orb, which is only in SRD 5.2, to the spellbook", async () => {
      const response = await post("/edit/spellbook", { spell_id: "srd_chromatic_orb" })
      const body = (await parseHtml(response)).body.textContent || ""

      expect(body).toContain("Chromatic Orb isn't part of SRD 5.1")
    })

    test("can add a 5.1 spell to the spellbook", async () => {
      await post("/edit/spellbook", { spell_id: "srd_magic_missile" })

      const char = await computeCharacter(testCtx.db, character.id)
      expect(char!.spells.find((s) => s.class === "wizard")!.knownSpells).toContain(
        "srd_magic_missile"
      )
    })

    describe("with Chromatic Orb in the spellbook from before", () => {
      beforeEach(async () => {
        await createSpellLearned(testCtx.db, {
          character_id: character.id,
          spell_id: "srd_chromatic_orb",
          note: null,
        })
      })

      test("lists it in the spellbook, flagged, without a prepare button", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
        const document = await parseHtml(response)

        const row = getElements(document, "#spells-panel tr").find((tr) =>
          tr.textContent?.includes("Chromatic Orb")
        )
        expect(row).toBeDefined()
        expect(row!.querySelector(".spell-issue-badge")).not.toBeNull()
        const prepare = row!.querySelector("button[title='Add to prepared spells']")!
        expect(prepare.hasAttribute("disabled")).toBe(true)
        expect(prepare.parentElement!.getAttribute("title")).toContain(
          "Chromatic Orb is from SRD 5.2.1"
        )
      })
    })
  })

  describe("spells a class lost between editions", () => {
    describe("an SRD 5.1 wizard with Augury (a 5.1 cleric-only spell) in the spellbook", () => {
      beforeEach(async () => {
        await createCaster(SRD51_ID, "wizard")
        await createSpellLearned(testCtx.db, {
          character_id: character.id,
          spell_id: "srd_augury",
          note: null,
        })
      })

      test("flags it and explains why it can't be prepared", async () => {
        const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
        const document = await parseHtml(response)

        const row = getElements(document, "#spells-panel tr").find((tr) =>
          tr.textContent?.includes("Augury")
        )!
        expect(row.querySelector(".spell-issue-badge")?.textContent).toBe("Not a wizard spell")
        const prepare = row.querySelector("button[title='Add to prepared spells']")!
        expect(prepare.hasAttribute("disabled")).toBe(true)
        expect(prepare.parentElement!.getAttribute("title")).toBe(
          "Can't prepare: Augury isn't a wizard spell in SRD 5.1."
        )
      })

      test("doesn't offer it in the prepare form", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/prepspell?class=wizard&spell_type=spell`,
          { user }
        )
        const document = await parseHtml(response)

        expect(elementExists(document, "#spell-srd_augury")).toBe(false)
      })
    })

    describe("an SRD 5.1 bard with Aid (a 5.2 bard spell) prepared", () => {
      beforeEach(async () => {
        await createCaster(SRD51_ID, "bard")
        await prepareDirectly(testCtx.db, "bard", "srd_aid")
      })

      test("flags it on the sheet, and it can still be cast", async () => {
        const sheet = await parseHtml(
          await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
        )
        const badge = expectElement(sheet, "#spells-panel .spell-issue-badge")
        expect(badge.textContent).toBe("Not a bard spell")
        expect(badge.getAttribute("title")).toContain("Aid isn't a bard spell in SRD 5.1.")

        const response = await post("/castspell", { spell_id: "srd_aid", slot_level: "2" })
        const body = (await parseHtml(response)).body.textContent || ""
        expect(body).not.toContain("not prepared")
        const char = await computeCharacter(testCtx.db, character.id)
        expect(char!.availableSpellSlots.filter((l) => l === 2)).toHaveLength(1)
      })
    })
  })

  describe("the Black Tentacles id migration", () => {
    // Black Tentacles and Blade Barrier used to share srd_blade_barrier, which always resolved
    // to Black Tentacles; the migration moves those rows to Black Tentacles' own id
    async function runMigration() {
      const file = await Bun.file(
        `${import.meta.dir}/../../migrations/20261012173005_remap_black_tentacles_spell_id.sql`
      ).text()
      const up = file.split("-- migrate:down")[0]!.replace("-- migrate:up", "")
      await testCtx.db.unsafe(up)
    }

    test("shows a wizard's srd_blade_barrier spell as Black Tentacles", async () => {
      await createCaster(SRD51_ID, "wizard")
      await createSpellLearned(testCtx.db, {
        character_id: character.id,
        spell_id: "srd_blade_barrier",
        note: null,
      })
      await runMigration()

      const sheet = await parseHtml(
        await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
      )
      const spellbook = sheet.querySelector("#spells-panel")?.textContent || ""
      expect(spellbook).toContain("Black Tentacles")
      expect(spellbook).not.toContain("Blade Barrier")
    })

    test("leaves a cleric's srd_blade_barrier alone", async () => {
      await createCaster(SRD51_ID, "cleric")
      await prepareDirectly(testCtx.db, "cleric", "srd_blade_barrier")
      await runMigration()

      const [row] = await testCtx.db`
        SELECT spell_id FROM char_spells_prepared WHERE character_id = ${character.id}`
      expect(row.spell_id).toBe("srd_blade_barrier")
    })
  })

  describe("casting Cure Wounds", () => {
    async function castCureWounds() {
      await post("/edit/prepspell", {
        class: "cleric",
        spell_type: "spell",
        spell_id: "srd_cure_wounds",
      })
      const response = await post("/castspell", { spell_id: "srd_cure_wounds", slot_level: "1" })
      return (await parseHtml(response)).body.textContent || ""
    }

    test("heals 1d8 for an SRD 5.1 cleric", async () => {
      await createCaster(SRD51_ID, "cleric")
      const body = await castCureWounds()

      expect(body).toContain("1d8")
      expect(body).not.toContain("2d8")
    })

    test("heals 2d8 for an SRD 5.2 cleric", async () => {
      await createCaster(SRD52_ID, "cleric")
      const body = await castCureWounds()

      expect(body).toContain("2d8")
    })
  })

  describe("Reed's lookup_spell", () => {
    async function lookup(spellName: string) {
      const char = await computeCharacter(testCtx.db, character.id)
      return executeLookupSpell(testCtx.db, char!, { spell_name: spellName })
    }

    describe("for an SRD 5.1 character", () => {
      beforeEach(async () => {
        await createCaster(SRD51_ID, "cleric")
      })

      test("returns the 5.1 version of a spell", async () => {
        const result = await lookup("cure wounds")

        expect(result.complete).toBe(true)
        if (result.complete) {
          expect(result.result.healingDice).toEqual([8])
          expect(result.result.source).toBe("SRD 5.1")
        }
      })

      test("says when a spell is only in SRD 5.2", async () => {
        const result = await lookup("hex")

        expect(result.complete).toBe(false)
        if (!result.complete) {
          expect(result.errors.spell_name).toContain("Hex is in SRD 5.2 but not in SRD 5.1")
        }
      })
    })

    describe("with an apostrophe in the name", () => {
      test("finds Hunter’s Mark for an SRD 5.2 ranger typing a straight apostrophe", async () => {
        await createCaster(SRD52_ID, "ranger")
        const result = await lookup("hunter's mark")

        expect(result.complete).toBe(true)
        if (result.complete) expect(result.result.name).toBe("Hunter’s Mark")
      })

      test("finds Hunter's Mark for an SRD 5.1 ranger typing a curly apostrophe", async () => {
        await createCaster(SRD51_ID, "ranger")
        const result = await lookup("Hunter’s Mark")

        expect(result.complete).toBe(true)
        if (result.complete) expect(result.result.name).toBe("Hunter's Mark")
      })
    })

    describe("for an SRD 5.2 character", () => {
      beforeEach(async () => {
        await createCaster(SRD52_ID, "cleric")
      })

      test("returns the 5.2 version of a spell", async () => {
        const result = await lookup("cure wounds")

        expect(result.complete).toBe(true)
        if (result.complete) expect(result.result.healingDice).toEqual([8, 8])
      })
    })
  })
})
