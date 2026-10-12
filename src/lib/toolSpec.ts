import type { ComputedCharacter } from "@src/services/computeCharacter"
import type { SQL } from "bun"
import type { z } from "zod"
import type { ServiceResult } from "./serviceResult"

/**
 * What the model sees of a tool: a description and the schema of its input
 * The registry in src/tools.ts turns these into AI SDK tools
 */
export interface ToolSpec<S extends z.ZodType = z.ZodType> {
  description: string
  inputSchema: S
}

/**
 * The parameters a tool's executor and formatter receive, parsed by its input schema
 */
export type ToolInput<T extends ToolSpec> = z.output<T["inputSchema"]>

/**
 * Runs a tool call; with isCheck, only validates it
 */
export type ToolExecutor<P> = (
  db: SQL,
  char: ComputedCharacter,
  parameters: P,
  isCheck?: boolean
  // biome-ignore lint/suspicious/noExplicitAny: Service results can be any valid JSON
) => Promise<ServiceResult<Record<string, any>>>

/**
 * Describes a pending tool call to the player, for approval
 */
export type ToolFormatter<P> = (parameters: P, character: ComputedCharacter) => string

/**
 * Convert tool parameters to the form data our services parse
 * Primitives become strings, as a submitted form would have them; arrays and objects are kept
 * for the fields that take them, and missing values are left out
 */
// biome-ignore lint/suspicious/noExplicitAny: Form data mixes strings with arrays and objects
export function toFormData(parameters: Record<string, unknown>): Record<string, any> {
  // biome-ignore lint/suspicious/noExplicitAny: Form data mixes strings with arrays and objects
  const data: Record<string, any> = {}
  for (const [key, value] of Object.entries(parameters)) {
    if (value === null || value === undefined) continue
    data[key] = typeof value === "object" ? value : String(value)
  }
  return data
}
