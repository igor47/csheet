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
  const toolResults = message.tool_results ?? {}

  // Update tool_results mapping
  toolResults[toolCallId] = result

  // Save updated tool_results (bun:sql handles JSONB encoding)
  await db`
    UPDATE chat_messages
    SET tool_results = ${toolResults}
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
  const executor = TOOL_EXECUTORS[unresolvedTool.toolName]

  if (!executor) {
    const toolResult: ToolExecutorResult = {
      status: "failed",
      error: `No executor defined for tool: ${unresolvedTool.toolName}`,
    }

    await updateToolResult(db, unresolvedTool.messageId, unresolvedTool.toolCallId, toolResult)
    return toolResult
  }

  try {
    // Execute the tool (with optional validation mode)
    const result = await executor(db, char, unresolvedTool.parameters, isCheck)

    const errorFields = result.complete
      ? []
      : Object.entries(result.errors).map(([k, v]) => `${k}: ${v}`)

    // validation check should always return complete=false
    if (isCheck) {
      // this should never happen
      if (result.complete === true) {
        throw new Error("Tool executor returned complete=true during validation check")
      }

      // if we actually had validation errors, store them for the LLM to see
      if (errorFields.length > 0) {
        const toolResult: ToolExecutorResult = {
          status: "failed",
          error: `Tool validation failed with ${errorFields.length} errors: ${errorFields.join(", ")}`,
        }
        await updateToolResult(db, unresolvedTool.messageId, unresolvedTool.toolCallId, toolResult)
        return toolResult

        // Validation check passed, do not store result yet
      } else {
        return { status: "success" }
      }

      // we actually executed the tool, store the result
    } else {
      let toolResult: ToolExecutorResult
      if (result.complete === true) {
        toolResult = {
          status: "success",
          data: result.result,
        }
      } else {
        toolResult = {
          status: "failed",
          error: `Tool execution failed with ${errorFields.length} errors: ${errorFields.join(", ")}`,
        }
      }

      await updateToolResult(db, unresolvedTool.messageId, unresolvedTool.toolCallId, toolResult)
      return toolResult
    }

    // If executor throws an exception, convert to failed result
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const toolResult: ToolExecutorResult = {
      status: "failed",
      error: errorMessage,
    }

    // Store the error result
    await updateToolResult(db, unresolvedTool.messageId, unresolvedTool.toolCallId, toolResult)
    return toolResult
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
