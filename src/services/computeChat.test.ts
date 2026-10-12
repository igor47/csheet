import { beforeEach, describe, expect, test } from "bun:test"
import type { Character } from "@src/db/characters"
import { create as createChatMessage } from "@src/db/chat_messages"
import { ulid } from "@src/lib/ids"
import { useTestApp } from "@src/test/app"
import { characterFactory } from "@src/test/factories/character"
import { userFactory } from "@src/test/factories/user"
import { computeChat } from "./computeChat"

describe("computeChat", () => {
  const testCtx = useTestApp()
  const chatId = ulid()

  let character: Character

  async function addMessage(role: "system" | "user" | "assistant", content: string) {
    await createChatMessage(testCtx.db, {
      character_id: character.id,
      chat_id: chatId,
      role,
      content,
      tool_calls: null,
      tool_results: null,
      error: null,
      usage: null,
    })
  }

  beforeEach(async () => {
    const user = await userFactory.create({}, testCtx.db)
    character = await characterFactory.create({ user_id: user.id }, testCtx.db)
    await addMessage("system", "You are Reed")
  })

  describe("with a short chat", () => {
    beforeEach(async () => {
      await addMessage("user", "hello")
    })

    test("sends the system prompt as cached instructions, not as a message", async () => {
      const chat = await computeChat(testCtx.db, chatId)

      expect(chat.llmInstructions?.content).toBe("You are Reed")
      expect(chat.llmInstructions?.providerOptions?.anthropic?.cacheControl).toEqual({
        type: "ephemeral",
      })
      expect(chat.llmMessages.some((m) => m.role === "system")).toBe(false)
    })
  })

  describe("with more messages than the history window", () => {
    beforeEach(async () => {
      for (let i = 0; i < 30; i++) {
        await addMessage("user", `question ${i}`)
        await addMessage("assistant", `answer ${i}`)
      }
    })

    test("still sends the system prompt", async () => {
      const chat = await computeChat(testCtx.db, chatId)

      expect(chat.llmMessages.some((m) => m.content === "question 0")).toBe(false)
      expect(chat.llmInstructions?.content).toBe("You are Reed")
    })
  })
})
