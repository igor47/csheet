import type { ToolResult } from "@src/db/chat_messages"
import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { UnresolvedToolCall } from "@src/services/computeChat"
import { TOOL_EXECUTORS, type ToolExecutorResult } from "@src/tools"
import type { SQL } from "bun"

/**
 * Helper function to update tool_results in the database
 * Loads message, updates the tool_results JSON field, and saves back
 */
async function updateToolResult(
  db: SQL,
  messageId: string,
  toolCallId: string,
  result: ToolResult
): Promise<void> {
  // Load the message to update tool_results
  const messages = await db`
    SELECT * FROM chat_messages WHERE id = ${messageId}
  `

  if (messages.length === 0) {
    throw new Error(`Message not found: ${messageId}`)
  }

  const message = messages[0]
  const toolResults = message.tool_results ? JSON.parse(message.tool_results) : {}

  // Update tool_results mapping
  toolResults[toolCallId] = result

  // Save updated tool_results
  await db`
    UPDATE chat_messages
    SET tool_results = ${JSON.stringify(toolResults)}
    WHERE id = ${messageId}
  `
}

/**
 * Execute a tool call that has been approved by the user
 * Returns the execution result
 */
export async function executeTool(
  db: SQL,
  char: ComputedCharacter,
  unresolvedTool: UnresolvedToolCall,
  isCheck?: boolean
): Promise<ToolExecutorResult> {
  try {
    const executor = TOOL_EXECUTORS[unresolvedTool.toolName]

    let result: ToolExecutorResult
    if (executor) {
      result = await executor(db, char, unresolvedTool.parameters, isCheck)
    } else {
      result = {
        status: "failed",
        error: `No executor defined for tool: ${unresolvedTool.toolName}`,
      }
    }

    // Execute the tool (with optional validation mode)

    // Save the result to database, but only when:
    // 1. Not a validation check (isCheck=false), OR
    // 2. Validation failed (status !== "success")
    // This allows LLM to see validation errors and self-correct,
    // while keeping successful validations unresolved for user approval
    if (!isCheck || result.status !== "success") {
      await updateToolResult(db, unresolvedTool.messageId, unresolvedTool.toolCallId, result)
    }

    return result
  } catch (error) {
    // If executor throws an exception, convert to failed result
    const errorMessage = error instanceof Error ? error.message : String(error)
    const result: ToolExecutorResult = {
      status: "failed",
      error: errorMessage,
    }

    // Store the error result
    await updateToolResult(db, unresolvedTool.messageId, unresolvedTool.toolCallId, result)

    return result
  }
}

/**
 * Reject a tool call (user declined to execute it)
 * Returns a rejection result
 */
export async function rejectTool(
  db: SQL,
  unresolvedTool: UnresolvedToolCall
): Promise<ToolExecutorResult> {
  // Mark as rejected
  const result: ToolExecutorResult = { status: "rejected" }

  await updateToolResult(db, unresolvedTool.messageId, unresolvedTool.toolCallId, result)

  return result
}
