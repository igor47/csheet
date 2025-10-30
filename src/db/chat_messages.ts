import type { SQL } from "bun"
import { ulid } from "ulid"
import { z } from "zod"

export const ChatMessageSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  chat_id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  tool_calls: z.record(z.string(), z.any()).nullable().default(null),
  tool_results: z.record(z.string(), z.any()).nullable().default(null),
  created_at: z.date(),
})

export const CreateChatMessageSchema = ChatMessageSchema.omit({
  id: true,
  created_at: true,
})

export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type CreateChatMessage = z.infer<typeof CreateChatMessageSchema>

export async function create(db: SQL, message: CreateChatMessage): Promise<ChatMessage> {
  const id = ulid()

  const result = await db`
    INSERT INTO chat_messages (id, character_id, chat_id, role, content, tool_calls, tool_results, created_at)
    VALUES (
      ${id},
      ${message.character_id},
      ${message.chat_id},
      ${message.role},
      ${message.content},
      ${message.tool_calls ? JSON.stringify(message.tool_calls) : null},
      ${message.tool_results ? JSON.stringify(message.tool_results) : null},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  const row = result[0]
  return ChatMessageSchema.parse({
    ...row,
    tool_calls: row.tool_calls ? JSON.parse(row.tool_calls) : null,
    tool_results: row.tool_results ? JSON.parse(row.tool_results) : null,
    created_at: new Date(row.created_at),
  })
}

// Chat-specific functions
export async function findByChatId(db: SQL, chatId: string, limit = 50): Promise<ChatMessage[]> {
  const result = await db`
    SELECT * FROM chat_messages
    WHERE chat_id = ${chatId}
    ORDER BY created_at DESC
    LIMIT ${limit}
  `

  return (
    result
      // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
      .map((row: any) =>
        ChatMessageSchema.parse({
          ...row,
          tool_calls: row.tool_calls ? JSON.parse(row.tool_calls) : null,
          tool_results: row.tool_results ? JSON.parse(row.tool_results) : null,
          created_at: new Date(row.created_at),
        })
      )
      .reverse()
  ) // Return in chronological order (oldest first)
}

export interface ChatPreview {
  chat_id: string
  character_id: string
  message_count: number
  last_message: string
  last_message_at: Date
}

export async function getChatsByCharacterId(db: SQL, characterId: string): Promise<ChatPreview[]> {
  const result = await db`
    SELECT
      chat_id,
      character_id,
      COUNT(*) as message_count,
      (
        SELECT content
        FROM chat_messages cm2
        WHERE cm2.chat_id = cm.chat_id
        ORDER BY created_at DESC
        LIMIT 1
      ) as last_message,
      MAX(created_at) as last_message_at
    FROM chat_messages cm
    WHERE character_id = ${characterId}
    GROUP BY chat_id, character_id
    ORDER BY last_message_at DESC
  `

  // biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
  return result.map((row: any) => ({
    chat_id: row.chat_id,
    character_id: row.character_id,
    message_count: Number(row.message_count),
    last_message: row.last_message,
    last_message_at: new Date(row.last_message_at),
  }))
}

export async function clearChat(db: SQL, chatId: string): Promise<void> {
  await db`
    DELETE FROM chat_messages
    WHERE chat_id = ${chatId}
  `
}
