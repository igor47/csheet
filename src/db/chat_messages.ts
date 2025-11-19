import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

export const ToolCallSchema = z.object({
  name: z.string(),
  parameters: z.record(z.string(), z.any()),
})

export const ToolResultSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("rejected") }),
  z.object({ status: z.literal("failed"), error: z.string().optional() }),
  z.object({ status: z.literal("success"), data: z.record(z.string(), z.any()).optional() }),
])

export const MessageErrorSchema = z.object({
  type: z.enum(["prep", "stream"]),
  message: z.string(),
  retryAt: z
    .union([z.date(), z.string()])
    .transform((val) => (typeof val === "string" ? new Date(val) : val))
    .optional(),
})

export const UsageSchema = z.object({
  provider: z.string(),
  modelId: z.string(),
  inputTokens: z.number(),
  outputTokens: z.number(),
  cachedInputTokens: z.number().optional(),
  totalTokens: z.number(),
})

export const ChatMessageSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  chat_id: z.string(),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string(),
  tool_calls: z.record(z.string(), ToolCallSchema).nullable().default(null),
  tool_results: z.record(z.string(), ToolResultSchema.nullable()).nullable().default(null),
  error: MessageErrorSchema.nullable().default(null),
  usage: UsageSchema.nullable().default(null),
  created_at: z.date(),
})

export const CreateChatMessageSchema = ChatMessageSchema.omit({
  id: true,
  created_at: true,
})

export type ToolCall = z.infer<typeof ToolCallSchema>
export type ToolResult = z.infer<typeof ToolResultSchema>
export type MessageError = z.infer<typeof MessageErrorSchema>
export type Usage = z.infer<typeof UsageSchema>
export type ChatMessage = z.infer<typeof ChatMessageSchema>
export type CreateChatMessage = z.infer<typeof CreateChatMessageSchema>

/**
 * Parse a database row into a ChatMessage
 * Centralizes the JSON parsing and date conversion logic
 */
// biome-ignore lint/suspicious/noExplicitAny: database row, validated by Zod
function parseMessageRow(row: any): ChatMessage {
  return ChatMessageSchema.parse({
    ...row,
    tool_calls: row.tool_calls ?? null,
    tool_results: row.tool_results ?? null,
    error: row.error ?? null,
    usage: row.usage ?? null,
    created_at: new Date(row.created_at),
  })
}

export async function create(db: SQL, message: CreateChatMessage): Promise<ChatMessage> {
  const id = ulid()

  const result = await db`
    INSERT INTO chat_messages (id, character_id, chat_id, role, content, tool_calls, tool_results, error, usage, created_at)
    VALUES (
      ${id},
      ${message.character_id},
      ${message.chat_id},
      ${message.role},
      ${message.content},
      ${message.tool_calls},
      ${message.tool_results},
      ${message.error},
      ${message.usage},
      CURRENT_TIMESTAMP
    )
    RETURNING *
  `

  return parseMessageRow(result[0])
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
      .map((row: any) => parseMessageRow(row))
      .reverse()
  ) // Return in chronological order (oldest first)
}

export interface ChatPreview {
  chat_id: string
  character_id: string
  message_count: number
  last_message: string
  last_message_at: Date
  total_tokens: number | null
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
      MAX(created_at) as last_message_at,
      (
        SELECT usage->'totalTokens'
        FROM chat_messages cm2
        WHERE cm2.chat_id = cm.chat_id
          AND usage IS NOT NULL
        ORDER BY created_at DESC
        LIMIT 1
      ) as total_tokens
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
    total_tokens: row.total_tokens ? Number(row.total_tokens) : null,
  }))
}

export async function clearChat(db: SQL, chatId: string): Promise<void> {
  await db`
    DELETE FROM chat_messages
    WHERE chat_id = ${chatId}
  `
}

export async function setMessageRetry(db: SQL, messageId: string): Promise<ChatMessage> {
  const result = await db`
    UPDATE chat_messages
    SET error = jsonb_set(error, '{retryAt}', to_jsonb(CURRENT_TIMESTAMP))
    WHERE id = ${messageId} AND error IS NOT NULL
    RETURNING *
  `

  if (result.length === 0) {
    throw new Error(`Message ${messageId} not found or has no error`)
  }

  return parseMessageRow(result[0])
}
