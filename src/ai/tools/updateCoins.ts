import { UpdateCoinsApiSchema } from "@src/services/updateCoins"

/**
 * Tool schema for updating character coins
 * Uses delta schema for changes (omits make_change and is_check)
 */
export const UpdateCoinsToolSchema = UpdateCoinsApiSchema.omit({
  make_change: true,
  is_check: true,
})

export type UpdateCoinsToolInput = {
  pp?: number
  gp?: number
  ep?: number
  sp?: number
  cp?: number
  note: string
}

/**
 * Tool definition for Anthropic API
 * Uses deltas (changes) rather than absolute values
 */
export const updateCoinsTool = {
  name: "update_coins",
  description: `Update the character's coin purse using CHANGES (deltas), not absolute totals.

IMPORTANT: Provide the CHANGE in coins (positive for gains, negative for losses), not the new total.

Examples:
- Character spends 50gp → pass gp: -50 (negative for spending)
- Character finds 200gp → pass gp: 200 (positive for finding)
- Character spends 20gp and finds 100sp → pass gp: -20, sp: 100
- Character pays 5gp for room and board → pass gp: -5

Only include coin types that changed (don't need to specify coins that didn't change).
Always include a descriptive note explaining the transaction.`,
  input_schema: {
    type: "object" as const,
    properties: {
      pp: {
        type: "number" as const,
        description:
          "Change in platinum pieces (positive = gain, negative = loss). Omit if unchanged.",
      },
      gp: {
        type: "number" as const,
        description: "Change in gold pieces (positive = gain, negative = loss). Omit if unchanged.",
      },
      ep: {
        type: "number" as const,
        description:
          "Change in electrum pieces (positive = gain, negative = loss). Omit if unchanged.",
      },
      sp: {
        type: "number" as const,
        description:
          "Change in silver pieces (positive = gain, negative = loss). Omit if unchanged.",
      },
      cp: {
        type: "number" as const,
        description:
          "Change in copper pieces (positive = gain, negative = loss). Omit if unchanged.",
      },
      note: {
        type: "string" as const,
        description: "Note describing the transaction (required)",
      },
    },
    required: ["note"],
  },
}
