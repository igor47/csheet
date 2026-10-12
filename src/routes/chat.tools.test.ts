import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { config } from "@src/config"
import { getCurrentLevels } from "@src/db/char_levels"
import type { Character } from "@src/db/characters"
import {
  type ChatMessage,
  create as createChatMessage,
  findById,
  type ToolCall,
} from "@src/db/chat_messages"
import type { User } from "@src/db/users"
import { SRD51_ID } from "@src/lib/dnd/srd51"
import { ulid } from "@src/lib/ids"
import { executeCharacterStatus } from "@src/services/characterStatus"
import { computeCharacter } from "@src/services/computeCharacter"
import { recordDeathSave } from "@src/services/deathSaves"
import { advanceToolCalls, SKIPPED_TOOL_CALL_ERROR } from "@src/services/toolExecution"
import { updateHitPoints } from "@src/services/updateHitPoints"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { getElements, makeRequest, parseHtml } from "@src/test/http"

// Ids chosen so jsonb's key order (by length, then bytes) is the reverse of the model's order
const FIRST_ID = "toolu_01zz"
const SECOND_ID = "toolu_2"

describe("resolving Reed's tool calls", () => {
  const testCtx = useTestApp()
  const originalApiKey = config.anthropicApiKey

  beforeEach(() => {
    ;(config as { anthropicApiKey: string }).anthropicApiKey = "test-key"
  })

  afterEach(() => {
    ;(config as { anthropicApiKey: string }).anthropicApiKey = originalApiKey
  })

  let user: User
  let character: Character
  let chatId: string
  let assistantMsg: ChatMessage

  // A level 2 fighter, with Reed asking for levels 3 (picking a subclass) and 4, in that order
  async function createLevelUpChat({
    subclass = "champion",
    secondRoll = 5,
    extraCalls = [] as ToolCall[],
  } = {}) {
    chatId = ulid()
    const base = {
      character_id: character.id,
      chat_id: chatId,
      tool_calls: null,
      tool_results: null,
      error: null,
      usage: null,
    }
    await createChatMessage(testCtx.db, { ...base, role: "system", content: "system prompt" })
    await createChatMessage(testCtx.db, { ...base, role: "user", content: "level me up to 4" })
    assistantMsg = await createChatMessage(testCtx.db, {
      ...base,
      role: "assistant",
      content: "Leveling you up!",
      tool_calls: [
        {
          id: FIRST_ID,
          name: "add_level",
          parameters: { class: "fighter", subclass, hit_die_roll: 6 },
        },
        {
          id: SECOND_ID,
          name: "add_level",
          parameters: { class: "fighter", hit_die_roll: secondRoll },
        },
        ...extraCalls,
      ],
      tool_results: Object.fromEntries(
        [FIRST_ID, SECOND_ID, ...extraCalls.map((call) => call.id)].map((id) => [id, null])
      ),
    })
  }

  function toolPath(toolCallId: string, action: "approve" | "reject") {
    return `/characters/${character.id}/chat/${chatId}/tool/${toolCallId}/${action}`
  }

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
    character = await characterFactory.create(
      { user_id: user.id, class: "fighter", level: 2, ruleset: SRD51_ID },
      testCtx.db
    )
  })

  describe("with two level-ups that depend on each other", () => {
    beforeEach(async () => {
      await createLevelUpChat()
    })

    test("keeps the tool calls in the order Reed made them", async () => {
      const msg = await findById(testCtx.db, assistantMsg.id)

      expect(msg?.tool_calls?.map((call) => call.id)).toEqual([FIRST_ID, SECOND_ID])
    })

    test("shows the approval cards in order, with only the first one actionable", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/chat/${chatId}/load`,
        { user }
      )
      const document = await parseHtml(response)

      const cards = getElements(document, "[id^='tool-']")
      expect(cards.map((card) => card.id)).toEqual([
        `tool-${assistantMsg.id}-${FIRST_ID}`,
        `tool-${assistantMsg.id}-${SECOND_ID}`,
      ])
      expect(cards[0]!.querySelector("button[disabled]")).toBeNull()
      expect(cards[1]!.querySelectorAll("button[disabled]").length).toBe(2)

      // both buttons are disabled while a request is in flight, so a double-click can't apply it twice
      for (const button of Array.from(cards[0]!.querySelectorAll("button"))) {
        expect(button.getAttribute("hx-disabled-elt")).toBe(`#${cards[0]!.id} button`)
      }
    })

    test("refuses to approve the second call before the first", async () => {
      const response = await makeRequest(testCtx.app, toolPath(SECOND_ID, "approve"), {
        user,
        method: "POST",
      })

      expect(response.status).toBe(409)
      expect(await getCurrentLevels(testCtx.db, character.id)).toEqual([
        expect.objectContaining({ class: "fighter", level: 2 }),
      ])
    })

    test("refuses to decline the second call before the first", async () => {
      const response = await makeRequest(testCtx.app, toolPath(SECOND_ID, "reject"), {
        user,
        method: "POST",
      })

      expect(response.status).toBe(409)
    })

    test("approving both in order levels up to 4 with the subclass", async () => {
      const first = await makeRequest(testCtx.app, toolPath(FIRST_ID, "approve"), {
        user,
        method: "POST",
      })
      expect(first.status).toBe(200)

      const second = await makeRequest(testCtx.app, toolPath(SECOND_ID, "approve"), {
        user,
        method: "POST",
      })
      expect(second.status).toBe(200)

      const msg = await findById(testCtx.db, assistantMsg.id)
      expect(msg?.tool_results?.[FIRST_ID]?.status).toBe("success")
      expect(msg?.tool_results?.[SECOND_ID]?.status).toBe("success")
      expect(await getCurrentLevels(testCtx.db, character.id)).toEqual([
        expect.objectContaining({ class: "fighter", level: 4, subclass: "champion" }),
      ])
    })
  })

  describe("when the second call is invalid", () => {
    beforeEach(async () => {
      // a fighter's hit die is a d10
      await createLevelUpChat({ secondRoll: 99 })
    })

    test("checks it only once the first call is approved", async () => {
      const before = await findById(testCtx.db, assistantMsg.id)
      expect(before?.tool_results?.[SECOND_ID]).toBeNull()

      const response = await makeRequest(testCtx.app, toolPath(FIRST_ID, "approve"), {
        user,
        method: "POST",
      })
      expect(response.status).toBe(200)

      const after = await findById(testCtx.db, assistantMsg.id)
      expect(after?.tool_results?.[SECOND_ID]).toEqual({
        status: "failed",
        error: expect.stringContaining("hit_die_roll"),
      })

      const document = await parseHtml(response)
      expect(getElements(document, "[id^='tool-']")).toHaveLength(0)
    })

    test("checks it once the first call is declined", async () => {
      const response = await makeRequest(testCtx.app, toolPath(FIRST_ID, "reject"), {
        user,
        method: "POST",
      })
      expect(response.status).toBe(200)

      const after = await findById(testCtx.db, assistantMsg.id)
      expect(after?.tool_results?.[FIRST_ID]).toEqual({ status: "rejected" })
      expect(after?.tool_results?.[SECOND_ID]?.status).toBe("failed")
    })
  })

  describe("when Reed writes the subclass name differently", () => {
    beforeEach(async () => {
      await createLevelUpChat({ subclass: "The Champion" })
    })

    test("stores the subclass under its name in the ruleset", async () => {
      await makeRequest(testCtx.app, toolPath(FIRST_ID, "approve"), { user, method: "POST" })

      expect(await getCurrentLevels(testCtx.db, character.id)).toEqual([
        expect.objectContaining({ class: "fighter", level: 3, subclass: "champion" }),
      ])
    })
  })

  describe("when Reed asks for a subclass that isn't available", () => {
    beforeEach(async () => {
      await createLevelUpChat({ subclass: "Rune Knight" })
    })

    test("fails, listing the subclasses that are available", async () => {
      await makeRequest(testCtx.app, toolPath(FIRST_ID, "approve"), { user, method: "POST" })

      const msg = await findById(testCtx.db, assistantMsg.id)
      const result = msg?.tool_results?.[FIRST_ID]
      expect(result?.status).toBe("failed")
      expect(result?.status === "failed" && result.error).toContain(
        '"Rune Knight" is not a subclass available to this character. Available fighter subclasses: champion, battle master, eldritch knight'
      )
      expect(msg?.tool_results?.[SECOND_ID]).toEqual({
        status: "failed",
        error: SKIPPED_TOOL_CALL_ERROR,
      })
      expect(await getCurrentLevels(testCtx.db, character.id)).toEqual([
        expect.objectContaining({ class: "fighter", level: 2 }),
      ])
    })

    test("when it fails validation, skips the calls after it before the user sees them", async () => {
      const char = (await computeCharacter(testCtx.db, character.id))!
      await advanceToolCalls(testCtx.db, char, assistantMsg.id)

      const msg = await findById(testCtx.db, assistantMsg.id)
      expect(msg?.tool_results?.[FIRST_ID]).toEqual({
        status: "failed",
        error: expect.stringContaining("Available fighter subclasses"),
      })
      expect(msg?.tool_results?.[SECOND_ID]).toEqual({
        status: "failed",
        error: SKIPPED_TOOL_CALL_ERROR,
      })

      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/chat/${chatId}/load`,
        { user }
      )
      const document = await parseHtml(response)
      expect(getElements(document, "[id^='tool-']")).toHaveLength(0)
    })
  })

  describe("with a read-only call after the level-ups", () => {
    const STATUS_ID = "toolu_3"

    beforeEach(async () => {
      await createLevelUpChat({
        extraCalls: [{ id: STATUS_ID, name: "character_status", parameters: {} }],
      })
    })

    test("doesn't run it until the calls before it are resolved", async () => {
      const char = (await computeCharacter(testCtx.db, character.id))!
      await advanceToolCalls(testCtx.db, char, assistantMsg.id)

      const msg = await findById(testCtx.db, assistantMsg.id)
      expect(msg?.tool_results?.[STATUS_ID]).toBeNull()
    })

    test("runs it after them, so it sees their changes", async () => {
      await makeRequest(testCtx.app, toolPath(FIRST_ID, "approve"), { user, method: "POST" })
      await makeRequest(testCtx.app, toolPath(SECOND_ID, "approve"), { user, method: "POST" })

      const msg = await findById(testCtx.db, assistantMsg.id)
      const result = msg?.tool_results?.[STATUS_ID]
      expect(result?.status).toBe("success")
      expect(result?.status === "success" && result.data?.totalLevel).toBe(4)
    })
  })
})

describe("Reed's death save tools", () => {
  const testCtx = useTestApp()
  const originalApiKey = config.anthropicApiKey
  const CALL_ID = "toolu_death"

  beforeEach(() => {
    ;(config as { anthropicApiKey: string }).anthropicApiKey = "test-key"
  })

  afterEach(() => {
    ;(config as { anthropicApiKey: string }).anthropicApiKey = originalApiKey
  })

  let user: User
  let character: Character
  let chatId: string
  let assistantMsg: ChatMessage

  // A chat where Reed asks to make one tool call
  async function createChat(call: Omit<ToolCall, "id">) {
    chatId = ulid()
    const base = {
      character_id: character.id,
      chat_id: chatId,
      tool_calls: null,
      tool_results: null,
      error: null,
      usage: null,
    }
    await createChatMessage(testCtx.db, { ...base, role: "system", content: "system prompt" })
    await createChatMessage(testCtx.db, { ...base, role: "user", content: "help" })
    assistantMsg = await createChatMessage(testCtx.db, {
      ...base,
      role: "assistant",
      content: "Noted.",
      tool_calls: [{ id: CALL_ID, ...call }],
      tool_results: { [CALL_ID]: null },
    })
  }

  async function approve() {
    const response = await makeRequest(
      testCtx.app,
      `/characters/${character.id}/chat/${chatId}/tool/${CALL_ID}/approve`,
      { user, method: "POST" }
    )
    expect(response.status).toBe(200)
    const msg = await findById(testCtx.db, assistantMsg.id)
    return msg?.tool_results?.[CALL_ID]
  }

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
    character = await characterFactory.create(
      { user_id: user.id, class: "fighter", level: 2, ruleset: SRD51_ID },
      testCtx.db
    )
    const char = (await computeCharacter(testCtx.db, character.id))!
    await updateHitPoints(testCtx.db, char, { action: "lose", amount: String(char.maxHitPoints) })
  })

  describe("when the character is dying", () => {
    test("character_status shows the death saves", async () => {
      await createChat({ name: "character_status", parameters: {} })
      const char = (await computeCharacter(testCtx.db, character.id))!
      await advanceToolCalls(testCtx.db, char, assistantMsg.id)

      const msg = await findById(testCtx.db, assistantMsg.id)
      const result = msg?.tool_results?.[CALL_ID]
      expect(result?.status === "success" && result.data?.deathSaves).toEqual({
        status: "dying",
        successes: 0,
        failures: 0,
      })
    })

    test("record_death_save records the roll", async () => {
      await createChat({ name: "record_death_save", parameters: { roll: 1 } })

      const result = await approve()

      expect(result?.status).toBe("success")
      expect(result?.status === "success" && result.data?.deathSaves).toEqual({
        status: "dying",
        successes: 0,
        failures: 2,
      })
    })

    test("update_hit_points with a critical hit adds two failures", async () => {
      await createChat({
        name: "update_hit_points",
        parameters: { action: "lose", amount: 4, critical: true },
      })

      const result = await approve()

      expect(result?.status === "success" && result.data?.deathSaves?.failures).toBe(2)
    })

    test("restore_to_life fails, since the character isn't dead", async () => {
      await createChat({ name: "restore_to_life", parameters: {} })

      const result = await approve()

      expect(result).toEqual({ status: "failed", error: expect.stringContaining("isn't dead") })
    })
  })

  describe("when the character is dead", () => {
    beforeEach(async () => {
      const char = (await computeCharacter(testCtx.db, character.id))!
      await recordDeathSave(testCtx.db, char, { outcome: "nat1" })
      await recordDeathSave(testCtx.db, (await computeCharacter(testCtx.db, character.id))!, {
        outcome: "failure",
      })
    })

    test("restore_to_life brings them back", async () => {
      await createChat({ name: "restore_to_life", parameters: { hp: 3, note: "Revivify" } })

      const result = await approve()

      expect(result).toEqual({ status: "success", data: { newHP: 3 } })
      const char = (await computeCharacter(testCtx.db, character.id))!
      expect(char.currentHP).toBe(3)
      expect(char.deathSaves).toBeNull()
    })
  })
})

describe("Reed's update_proficiencies tool", () => {
  const testCtx = useTestApp()
  const originalApiKey = config.anthropicApiKey
  const CALL_ID = "toolu_prof"

  beforeEach(() => {
    ;(config as { anthropicApiKey: string }).anthropicApiKey = "test-key"
  })

  afterEach(() => {
    ;(config as { anthropicApiKey: string }).anthropicApiKey = originalApiKey
  })

  let user: User
  let character: Character
  let chatId: string
  let assistantMsg: ChatMessage

  async function createProficiencyChat(parameters: Record<string, unknown>) {
    chatId = ulid()
    const base = {
      character_id: character.id,
      chat_id: chatId,
      tool_calls: null,
      tool_results: null,
      error: null,
      usage: null,
    }
    await createChatMessage(testCtx.db, { ...base, role: "system", content: "system prompt" })
    await createChatMessage(testCtx.db, {
      ...base,
      role: "user",
      content: "I took the Weapon Master feat",
    })
    assistantMsg = await createChatMessage(testCtx.db, {
      ...base,
      role: "assistant",
      content: "Noted.",
      tool_calls: [{ id: CALL_ID, name: "update_proficiencies", parameters }],
      tool_results: { [CALL_ID]: null },
    })
  }

  const approvePath = () => `/characters/${character.id}/chat/${chatId}/tool/${CALL_ID}/approve`

  async function currentProficiencies() {
    const char = await computeCharacter(testCtx.db, character.id)
    return char!.proficiencies.map((p) => `${p.kind}:${p.name}`)
  }

  beforeEach(async () => {
    user = await userFactory.create({}, testCtx.db)
    character = await characterFactory.create(
      { user_id: user.id, class: "wizard", level: 3, species: "human", ruleset: SRD51_ID },
      testCtx.db
    )
  })

  describe("adding weapons, the way a player might write them", () => {
    beforeEach(async () => {
      await createProficiencyChat({
        add: [
          { kind: "weapon", name: "Longswords" },
          { kind: "weapon", name: "Crossbow, hand" },
          { kind: "language", name: "Giant" },
        ],
        source: "Weapon Master feat",
      })
    })

    test("shows what it will do in the approval card", async () => {
      const response = await makeRequest(
        testCtx.app,
        `/characters/${character.id}/chat/${chatId}/load`,
        { user }
      )
      const document = await parseHtml(response)
      const card = getElements(document, "[id^='tool-']")[0]!
      expect(card.textContent).toContain(
        "Add proficiency in Longsword, Hand Crossbow, Giant (from Weapon Master feat)"
      )
    })

    test("adds them once approved, and refreshes the panel", async () => {
      const response = await makeRequest(testCtx.app, approvePath(), { user, method: "POST" })
      expect(response.status).toBe(200)

      expect(await currentProficiencies()).toEqual(
        expect.arrayContaining(["weapon:longsword", "weapon:hand crossbow", "language:giant"])
      )
      const document = await parseHtml(response)
      const panel = getElements(document, "#proficiencies-panel")[0]!
      expect(panel.textContent).toContain("Hand Crossbow")
    })
  })

  describe("removing a proficiency", () => {
    beforeEach(async () => {
      await createProficiencyChat({ remove: [{ kind: "weapon", name: "daggers" }] })
    })

    test("removes it once approved", async () => {
      expect(await currentProficiencies()).toContain("weapon:dagger")
      await makeRequest(testCtx.app, approvePath(), { user, method: "POST" })

      expect(await currentProficiencies()).not.toContain("weapon:dagger")
    })
  })

  describe("adding and removing the same proficiency", () => {
    beforeEach(async () => {
      await createProficiencyChat({
        add: [{ kind: "weapon", name: "dagger" }],
        remove: [{ kind: "weapon", name: "Daggers" }],
      })
    })

    test("fails the pre-check as no change, before the player sees it", async () => {
      const char = (await computeCharacter(testCtx.db, character.id))!
      await advanceToolCalls(testCtx.db, char, assistantMsg.id)

      const msg = await findById(testCtx.db, assistantMsg.id)
      expect(msg?.tool_results?.[CALL_ID]).toEqual({
        status: "failed",
        error: expect.stringContaining("Add or remove at least one proficiency"),
      })
    })
  })

  describe("removing a proficiency the character doesn't have", () => {
    beforeEach(async () => {
      await createProficiencyChat({ remove: [{ kind: "armor", name: "heavy armor" }] })
    })

    test("fails before the player sees it, saying what the character has", async () => {
      const char = (await computeCharacter(testCtx.db, character.id))!
      await advanceToolCalls(testCtx.db, char, assistantMsg.id)

      const msg = await findById(testCtx.db, assistantMsg.id)
      expect(msg?.tool_results?.[CALL_ID]).toEqual({
        status: "failed",
        error: expect.stringContaining(
          "Not proficient with Heavy Armor (current armor proficiencies: none)"
        ),
      })
    })
  })
})

describe("Reed's view of the character", () => {
  const testCtx = useTestApp()

  test("character_status includes proficiencies and weapon attacks", async () => {
    const user = await userFactory.create({}, testCtx.db)
    const character = await characterFactory.create(
      { user_id: user.id, class: "fighter", level: 1, strength: 14 },
      testCtx.db
    )
    const char = (await computeCharacter(testCtx.db, character.id))!
    const result = await executeCharacterStatus(testCtx.db, char, {})

    expect(result.complete).toBe(true)
    if (!result.complete) return
    expect(result.result.proficiencies).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "weapon", name: "martial weapons" })])
    )
    expect(result.result.weaponAttacks).toEqual([])
  })
})
