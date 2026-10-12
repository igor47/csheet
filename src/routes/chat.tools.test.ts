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
import { computeCharacter } from "@src/services/computeCharacter"
import { advanceToolCalls, SKIPPED_TOOL_CALL_ERROR } from "@src/services/toolExecution"
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
