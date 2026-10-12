import { beforeEach, describe, expect, test } from "bun:test"
import { create as createAbility } from "@src/db/char_abilities"
import { create as createLevel } from "@src/db/char_levels"
import { findByCharacterId as findRests } from "@src/db/char_rests"
import type { Character } from "@src/db/characters"
import type { User } from "@src/db/users"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { SRD52_ID } from "@src/lib/dnd/srd52"
import { type ComputedCharacter, computeCharacter } from "@src/services/computeCharacter"
import { updateHitPoints } from "@src/services/updateHitPoints"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { elementExists, expectElement, makeRequest, parseHtml } from "@src/test/http"

describe("dropping to 0 HP", () => {
  const testCtx = useTestApp()

  let user: User
  let character: Character
  let maxHP: number

  async function post(path: string, fields: Record<string, string> = {}) {
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

  const damage = (amount: number, fields: Record<string, string> = {}) =>
    post("/edit/hitpoints", { action: "lose", amount: String(amount), ...fields })
  const heal = (amount: number) =>
    post("/edit/hitpoints", { action: "restore", amount: String(amount) })
  const deathSave = (fields: Record<string, string>) => post("/deathsaves", fields)

  async function current(): Promise<ComputedCharacter> {
    return (await computeCharacter(testCtx.db, character.id))!
  }

  async function sheet() {
    const response = await makeRequest(testCtx.app, `/characters/${character.id}`, { user })
    return parseHtml(response)
  }

  function pips(document: Document, label: "successes" | "failures") {
    return expectElement(document, `[data-death-save-pips='${label}']`).getAttribute("data-count")
  }

  async function createCharacter(ruleset: typeof SRD51_ID | typeof SRD52_ID = SRD51_ID) {
    character = await characterFactory.create(
      { user_id: user.id, class: "fighter", level: 3, ruleset },
      testCtx.db
    )
    maxHP = (await current()).maxHitPoints
  }

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
    await createCharacter()
  })

  describe("with HP", () => {
    test("shows no death saves", async () => {
      expect(elementExists(await sheet(), "#death-saves")).toBe(false)
    })

    test("refuses a death save, refreshing the stale sheet", async () => {
      const document = await parseHtml(await deathSave({ outcome: "success" }))

      expect(elementExists(document, "#character-info")).toBe(true)
      expect(elementExists(document, "#death-saves")).toBe(false)
      expect((await current()).deathSaves).toBeNull()
    })
  })

  describe("when damage takes the character to exactly 0 HP", () => {
    beforeEach(async () => {
      await damage(maxHP)
    })

    test("they are dying, with no successes or failures", async () => {
      const char = await current()
      expect(char.currentHP).toBe(0)
      expect(char.deathSaves).toEqual({ status: "dying", successes: 0, failures: 0 })
    })

    test("the sheet shows them dying, with buttons to record a save", async () => {
      const document = await sheet()

      const panel = expectElement(document, "#death-saves")
      expect(panel.getAttribute("data-status")).toBe("dying")
      expect(panel.textContent).toContain("Dying")
      expect(pips(document, "successes")).toBe("0")
      expect(pips(document, "failures")).toBe("0")
      const outcomes = Array.from(panel.querySelectorAll("button[hx-post]")).map((button) =>
        JSON.parse(button.getAttribute("hx-vals") || "{}")
      )
      expect(outcomes.map((vals) => vals.outcome)).toEqual([
        "success",
        "failure",
        "nat1",
        "nat20",
        "stabilized",
      ])
    })
  })

  describe("when damage beyond their HP is less than their maximum", () => {
    test("HP stops at 0 and they are dying", async () => {
      const response = await damage(maxHP + maxHP - 1)
      expect(response.status).toBe(200)

      const char = await current()
      expect(char.currentHP).toBe(0)
      expect(char.deathSaves?.status).toBe("dying")
    })
  })

  describe("when damage beyond their HP equals their maximum", () => {
    beforeEach(async () => {
      await damage(maxHP + maxHP)
    })

    test("they die outright", async () => {
      const char = await current()
      expect(char.currentHP).toBe(0)
      expect(char.deathSaves?.status).toBe("dead")
    })

    test("the sheet shows them dead, with a way back", async () => {
      const document = await sheet()

      const panel = expectElement(document, "#death-saves")
      expect(panel.getAttribute("data-status")).toBe("dead")
      expect(panel.textContent).toContain("Dead")
      expect(elementExists(document, `button[hx-post='/characters/${character.id}/revive']`)).toBe(
        true
      )
      expect(elementExists(document, "[data-death-save-pips]")).toBe(false)
    })
  })

  describe("while dying", () => {
    beforeEach(async () => {
      await damage(maxHP)
    })

    test("a success fills a success pip", async () => {
      const document = await parseHtml(await deathSave({ outcome: "success" }))

      expect(pips(document, "successes")).toBe("1")
      expect((await current()).deathSaves).toEqual({ status: "dying", successes: 1, failures: 0 })
    })

    test("a failure fills a failure pip", async () => {
      const document = await parseHtml(await deathSave({ outcome: "failure" }))

      expect(pips(document, "failures")).toBe("1")
      expect((await current()).deathSaves).toEqual({ status: "dying", successes: 0, failures: 1 })
    })

    test("a natural 1 counts as two failures", async () => {
      await deathSave({ outcome: "nat1" })

      expect((await current()).deathSaves).toEqual({ status: "dying", successes: 0, failures: 2 })
    })

    test("a natural 20 brings them back with 1 HP", async () => {
      await deathSave({ outcome: "failure" })
      const document = await parseHtml(await deathSave({ outcome: "nat20" }))

      expect(elementExists(document, "#death-saves")).toBe(false)
      const char = await current()
      expect(char.currentHP).toBe(1)
      expect(char.deathSaves).toBeNull()
    })

    describe("recording the d20 roll", () => {
      test("10 or more is a success", async () => {
        await deathSave({ roll: "10" })

        expect((await current()).deathSaves?.successes).toBe(1)
      })

      test("under 10 is a failure", async () => {
        await deathSave({ roll: "9" })

        expect((await current()).deathSaves?.failures).toBe(1)
      })

      test("a 1 is two failures", async () => {
        await deathSave({ roll: "1" })

        expect((await current()).deathSaves?.failures).toBe(2)
      })

      test("a 20 regains 1 HP", async () => {
        await deathSave({ roll: "20" })

        expect((await current()).currentHP).toBe(1)
      })

      test("refuses a roll that isn't on a d20", async () => {
        const document = await parseHtml(await deathSave({ roll: "21" }))

        expect(expectElement(document, "#death-saves").textContent).toContain("between 1 and 20")
        expect((await current()).deathSaves).toEqual({
          status: "dying",
          successes: 0,
          failures: 0,
        })
      })
    })

    describe("after three successes", () => {
      beforeEach(async () => {
        await deathSave({ outcome: "failure" })
        await deathSave({ outcome: "success" })
        await deathSave({ outcome: "success" })
        await deathSave({ outcome: "success" })
      })

      test("they are stable, with the counts reset", async () => {
        const char = await current()
        expect(char.currentHP).toBe(0)
        expect(char.deathSaves).toEqual({ status: "stable", successes: 0, failures: 0 })
      })

      test("the sheet shows them stable, with a way to regain 1 HP", async () => {
        const document = await sheet()

        const panel = expectElement(document, "#death-saves")
        expect(panel.getAttribute("data-status")).toBe("stable")
        expect(panel.textContent).toContain("Stable")
        expect(panel.textContent).toContain("Regain 1 HP")
      })

      test("they make no more death saves", async () => {
        const document = await parseHtml(await deathSave({ outcome: "failure" }))

        expect(expectElement(document, "#death-saves").textContent).toContain("is stable")
        expect((await current()).deathSaves?.status).toBe("stable")
      })

      test("taking damage starts them dying again, with a failure", async () => {
        await damage(1)

        expect((await current()).deathSaves).toEqual({
          status: "dying",
          successes: 0,
          failures: 1,
        })
      })
    })

    test("being stabilized makes them stable", async () => {
      await deathSave({ outcome: "nat1" })
      await deathSave({ outcome: "stabilized" })

      expect((await current()).deathSaves).toEqual({ status: "stable", successes: 0, failures: 0 })
    })

    describe("after three failures", () => {
      beforeEach(async () => {
        await deathSave({ outcome: "success" })
        await deathSave({ outcome: "failure" })
        await deathSave({ outcome: "nat1" })
      })

      test("they are dead", async () => {
        expect((await current()).deathSaves).toEqual({
          status: "dead",
          successes: 1,
          failures: 3,
        })
      })
    })

    describe("taking damage", () => {
      test("is a death save failure", async () => {
        await damage(3)

        const char = await current()
        expect(char.currentHP).toBe(0)
        expect(char.deathSaves).toEqual({ status: "dying", successes: 0, failures: 1 })
      })

      test("from a critical hit is two failures", async () => {
        await damage(3, { critical: "on" })

        expect((await current()).deathSaves?.failures).toBe(2)
      })

      test("of at least their maximum kills them", async () => {
        await damage(maxHP)

        expect((await current()).deathSaves?.status).toBe("dead")
      })

      test("is offered as a critical hit on the HP form", async () => {
        const response = await makeRequest(
          testCtx.app,
          `/characters/${character.id}/edit/hitpoints`,
          { user }
        )
        const document = await parseHtml(response)

        expect(elementExists(document, "#hitpoints-critical")).toBe(true)
        expect(expectElement(document, "#hitpoints-action-lose").hasAttribute("disabled")).toBe(
          false
        )
      })
    })

    describe("healing", () => {
      beforeEach(async () => {
        await deathSave({ outcome: "success" })
        await deathSave({ outcome: "nat1" })
        await heal(5)
      })

      test("brings them back", async () => {
        const char = await current()
        expect(char.currentHP).toBe(5)
        expect(char.deathSaves).toBeNull()
      })

      test("resets their death saves for the next time they go down", async () => {
        await damage(5)

        expect((await current()).deathSaves).toEqual({
          status: "dying",
          successes: 0,
          failures: 0,
        })
      })
    })

    test("they can't take a long rest", async () => {
      const response = await post("/rest/long")
      const document = await parseHtml(response)

      expect(document.body.textContent).toContain("needs at least 1 HP to start a long rest")
      expect(await findRests(testCtx.db, character.id)).toEqual([])
      expect((await current()).currentHP).toBe(0)
    })

    test("the HP history shows them going down, their saves, and dying", async () => {
      await deathSave({ roll: "4" })
      await deathSave({ outcome: "success" })
      await damage(2, { critical: "on", note: "Orc axe" })

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/history/hitpoints`,
        { user }
      )
      const document = await parseHtml(response)
      const rows = Array.from(document.querySelectorAll("tbody tr")).map(
        (row) => row.textContent || ""
      )

      expect(rows[0]).toContain("Died")
      expect(rows[0]).toContain("Third death save failure")
      expect(rows[1]).toContain("Death save two failures")
      expect(rows[1]).toContain("Took 2 damage at 0 HP (critical hit): Orc axe")
      expect(rows[2]).toContain("Death save success")
      expect(rows[3]).toContain("Rolled 4 on a death save: failure")
      expect(rows[4]).toContain("Dropped to 0 HP, dying")
      expect(rows[5]).toContain(`Lost ${maxHP} HP`)
    })
  })

  describe("when dead", () => {
    beforeEach(async () => {
      await damage(maxHP)
      await deathSave({ outcome: "nat1" })
      await deathSave({ outcome: "failure" })
    })

    test("healing is refused", async () => {
      const document = await parseHtml(await heal(5))

      expect(expectElement(document, "#hitpoints-amount").className).toContain("is-invalid")
      expect(document.body.textContent).toContain("can't regain hit points until restored to life")
      expect((await current()).currentHP).toBe(0)
    })

    test("death saves are refused", async () => {
      const document = await parseHtml(await deathSave({ outcome: "nat20" }))

      expect(expectElement(document, "#death-saves").textContent).toContain("is dead")
      expect((await current()).currentHP).toBe(0)
    })

    for (const rest of ["short", "long"]) {
      test(`they can't take a ${rest} rest`, async () => {
        const document = await parseHtml(await post(`/rest/${rest}`))

        expect(document.body.textContent).toContain("is dead")
        expect(document.body.textContent).toContain("Restore to life")
        expect(document.body.textContent).not.toContain("Hit Points:")
        expect(await findRests(testCtx.db, character.id)).toEqual([])
        const char = await current()
        expect(char.currentHP).toBe(0)
        expect(char.deathSaves?.status).toBe("dead")
      })
    }

    test("the HP history says they died", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/history/hitpoints`,
        { user }
      )
      const rows = Array.from((await parseHtml(response)).querySelectorAll("tbody tr")).map(
        (row) => row.textContent || ""
      )

      expect(rows[0]).toContain("Died")
      expect(rows[0]).toContain("Third death save failure")
    })

    describe("when their HP maximum goes up", () => {
      beforeEach(async () => {
        await createLevel(testCtx.db, {
          character_id: character.id,
          class: "fighter",
          level: 4,
          subclass: null,
          hit_die_roll: 6,
          note: null,
        })
      })

      test("they are still dead, at 0 HP", async () => {
        const char = await current()
        expect(char.maxHitPoints).toBe(maxHP + 6)
        expect(char.currentHP).toBe(0)
        expect(char.deathSaves?.status).toBe("dead")
      })

      test("restoring them to life gives them 1 HP", async () => {
        await post("/revive")

        expect((await current()).currentHP).toBe(1)
      })
    })

    describe("restoring them to life", () => {
      beforeEach(async () => {
        await post("/revive")
      })

      test("brings them back with 1 HP", async () => {
        const char = await current()
        expect(char.currentHP).toBe(1)
        expect(char.deathSaves).toBeNull()
      })

      test("lets them be healed again", async () => {
        await heal(4)

        expect((await current()).currentHP).toBe(5)
      })

      test("starts afresh when they go down again", async () => {
        await damage(1)

        expect((await current()).deathSaves).toEqual({
          status: "dying",
          successes: 0,
          failures: 0,
        })
      })
    })
  })

  describe("when their HP maximum changes while dying", () => {
    async function setConstitution(score: number) {
      await createAbility(testCtx.db, {
        character_id: character.id,
        ability: "constitution",
        score,
        proficiency: false,
        note: null,
      })
    }

    beforeEach(async () => {
      await damage(maxHP)
      await deathSave({ outcome: "failure" })
      await deathSave({ outcome: "failure" })
    })

    test("going up doesn't wake them", async () => {
      await setConstitution(18)

      const char = await current()
      expect(char.maxHitPoints).toBeGreaterThan(maxHP)
      expect(char.currentHP).toBe(0)
      expect(char.deathSaves).toEqual({ status: "dying", successes: 0, failures: 2 })
    })

    test("going up and back down keeps them at 0 HP, never below", async () => {
      await setConstitution(18)
      await setConstitution(2)

      const char = await current()
      expect(char.currentHP).toBe(0)
      expect(char.deathSaves).toEqual({ status: "dying", successes: 0, failures: 2 })
    })

    test("healing counts from 0", async () => {
      await setConstitution(18)
      await heal(1)

      const char = await current()
      expect(char.currentHP).toBe(1)
      expect(char.deathSaves).toBeNull()
    })

    test("a natural 20 brings them to 1 HP", async () => {
      await setConstitution(2)
      await deathSave({ roll: "20" })

      const char = await current()
      expect(char.currentHP).toBe(1)
      expect(char.deathSaves).toBeNull()
    })
  })

  describe("when their HP maximum drops below their HP", () => {
    beforeEach(async () => {
      await damage(maxHP - 1)
      await createAbility(testCtx.db, {
        character_id: character.id,
        ability: "constitution",
        score: 2,
        proficiency: false,
        note: null,
      })
    })

    test("they are at 0 HP, not below, and dying", async () => {
      const char = await current()
      expect(char.currentHP).toBe(0)
      expect(char.deathSaves).toEqual({ status: "dying", successes: 0, failures: 0 })
    })

    test("healing counts from 0", async () => {
      await heal(1)

      expect((await current()).currentHP).toBe(1)
    })
  })

  describe("when requests race", () => {
    test("each sees the changes made before it", async () => {
      const stale = await current()
      const lose = (amount: number) =>
        updateHitPoints(testCtx.db, stale, { action: "lose", amount: String(amount) })

      await lose(maxHP)
      const result = await lose(1)

      expect(result.complete && result.result.deathSaves?.failures).toBe(1)
      const char = await current()
      expect(char.currentHP).toBe(0)
      expect(char.deathSaves).toEqual({ status: "dying", successes: 0, failures: 1 })
    })
  })

  describe("a stable character regaining 1 HP from the sheet", () => {
    test("shows why it couldn't, when it can't", async () => {
      await damage(maxHP)
      await deathSave({ outcome: "stabilized" })
      await damage(maxHP) // dies, but the sheet still shows them stable
      const document = await parseHtml(
        await post("/edit/hitpoints", { action: "restore", amount: "1", from_sheet: "true" })
      )

      expect(expectElement(document, "#death-saves").textContent).toContain(
        "can't regain hit points until restored to life"
      )
    })
  })

  describe("restoring a character who isn't dead", () => {
    test("is refused", async () => {
      await damage(maxHP)
      const document = await parseHtml(await post("/revive"))

      expect(expectElement(document, "#death-saves").textContent).toContain("isn't dead")
      expect((await current()).currentHP).toBe(0)
    })
  })

  describe("in SRD 5.2.1, at 0 HP", () => {
    beforeEach(async () => {
      await createCharacter(SRD52_ID)
      await damage(maxHP)
    })

    test("they can't take a short rest", async () => {
      const document = await parseHtml(await post("/rest/short"))

      expect(document.body.textContent).toContain("needs at least 1 HP to start a short rest")
    })

    test("the short rest form explains why, without offering hit dice", async () => {
      const response = await makeRequest(testCtx.app, `/characters/${character.id}/rest/short`, {
        user,
      })
      const document = await parseHtml(response)

      expect(expectElement(document, "#rest-blocked").textContent).toContain("Heal them first")
      expect(elementExists(document, "input[name^='dice.']")).toBe(false)
      expect(elementExists(document, "button[hx-post]")).toBe(false)
      expect(expectElement(document, ".modal-footer .btn-primary").hasAttribute("disabled")).toBe(
        true
      )
    })
  })
})
