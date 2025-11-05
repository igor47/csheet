import { zodToFormErrors } from "@src/lib/formErrors"
import { Checkbox, OptionalString } from "@src/lib/formSchemas"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"

export const ShortRestApiSchema = z.object({
  note: OptionalString(),
  is_check: Checkbox().optional().default(false),
})

export type ShortRestApi = z.infer<typeof ShortRestApiSchema>

export interface ShortRestSummary {
  message: string
}

export type ShortRestResult =
  | { complete: true; summary: ShortRestSummary }
  | { complete: false; values: Record<string, string>; errors: Record<string, string> }

/**
 * Perform a short rest for a character
 * - In D&D 5e, a short rest is at least 1 hour of downtime
 * - Characters can spend hit dice to recover HP during a short rest
 * - Some class features recharge on a short rest
 * - For now, we just acknowledge the rest and let players manually spend hit dice
 */
export async function shortRest(
  _db: SQL,
  _char: ComputedCharacter,
  data: Record<string, string>
): Promise<ShortRestResult> {
  // Stage 1: Partial Zod validation
  const checkD = ShortRestApiSchema.partial().safeParse(data)
  if (!checkD.success) {
    return { complete: false, values: data, errors: zodToFormErrors(checkD.error) }
  }

  // Stage 2: Custom validation (none needed for basic short rest)
  const errors: Record<string, string> = {}

  // Stage 3: Early return for check mode
  if (checkD.data.is_check || Object.keys(errors).length > 0) {
    return { complete: false, values: data, errors }
  }

  // Stage 4: Full Zod validation
  const result = ShortRestApiSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, values: data, errors: zodToFormErrors(result.error) }
  }

  // Stage 5: Execute the short rest
  // Short rest doesn't automatically restore anything
  // Players spend hit dice manually via the form
  // This is just to record that a short rest was taken

  return {
    complete: true,
    summary: {
      message:
        "Short rest taken! You can now spend hit dice to recover HP using the edit button next to Hit Dice.",
    },
  }
}
