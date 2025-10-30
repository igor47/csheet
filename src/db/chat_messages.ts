import type { SQL } from "bun"
import { ulid } from "ulid"
import { z } from "zod"

export const ChatMessageSchema = z.object({
  id: z.string(),
  character_id: z.string(),
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
    INSERT INTO chat_messages (id, character_id, role, content, tool_calls, tool_results, created_at)
    VALUES (
      ${id},
      ${message.character_id},
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

export async function findByCharacterId(
  db: SQL,
  characterId: string,
  limit = 50
): Promise<ChatMessage[]> {
  const result = await db`
    SELECT * FROM chat_messages
    WHERE character_id = ${characterId}
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

export async function clearHistory(db: SQL, characterId: string): Promise<void> {
  await db`
    DELETE FROM chat_messages
    WHERE character_id = ${characterId}
  `
}

export async function deleteById(db: SQL, id: string): Promise<void> {
  await db`
    DELETE FROM chat_messages
    WHERE id = ${id}
  `
}

export async function updateById(
  db: SQL,
  id: string,
  updates: Partial<Pick<ChatMessage, "content" | "tool_calls" | "tool_results">>
): Promise<void> {
  const setClauses: string[] = []
  const values: unknown[] = []

  if (updates.content !== undefined) {
    setClauses.push(`content = $${values.length + 1}`)
    values.push(updates.content)
  }

  if (updates.tool_calls !== undefined) {
    setClauses.push(`tool_calls = $${values.length + 1}`)
    values.push(updates.tool_calls ? JSON.stringify(updates.tool_calls) : null)
  }

  if (updates.tool_results !== undefined) {
    setClauses.push(`tool_results = $${values.length + 1}`)
    values.push(updates.tool_results ? JSON.stringify(updates.tool_results) : null)
  }

  if (setClauses.length === 0) {
    return // Nothing to update
  }

  values.push(id)

  await db.unsafe(
    `UPDATE chat_messages SET ${setClauses.join(", ")} WHERE id = $${values.length}`,
    values
  )
}
