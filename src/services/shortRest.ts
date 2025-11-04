import { z } from "zod"

export const ShortRestApiSchema = z.object({
  character_id: z.string(),
  note: z.string().nullable().optional().describe("Optional note about the short rest"),
})

export type ShortRestApi = z.infer<typeof ShortRestApiSchema>

export interface ShortRestSummary {
  message: string
}

/**
 * Perform a short rest for a character
 * - In D&D 5e, a short rest is at least 1 hour of downtime
 * - Characters can spend hit dice to recover HP during a short rest
 * - Some class features recharge on a short rest
 * - For now, we just acknowledge the rest and let players manually spend hit dice
 */
export async function shortRest(_data: ShortRestApi): Promise<ShortRestSummary> {
  // Short rest doesn't automatically restore anything
  // Players spend hit dice manually via the edit hit dice button
  // This is just to record that a short rest was taken

  return {
    message:
      "Short rest taken! You can now spend hit dice to recover HP using the edit button next to Hit Dice.",
  }
}
