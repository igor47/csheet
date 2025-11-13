import * as CharacterAvatars from "@src/db/character_avatars"
import { zodToFormErrors } from "@src/lib/formErrors"
import type { SQL } from "bun"
import { z } from "zod"
import type { ComputedCharacter } from "./computeCharacter"
import { validateUploadForUse } from "./uploads"

export const UpdateAvatarSchema = z.object({
  upload_id: z
    .string({
      error: (iss) => (iss.input === undefined ? "Upload ID is required" : "Invalid upload id"),
    })
    .length(26, "Invalid upload id"),
})

export type UpdateAvatarResult =
  | { complete: true }
  | { complete: false; errors: Record<string, string> }

/**
 * Update a character's avatar
 * Validates upload exists, belongs to user, and is complete
 * Creates a new character_avatar record (automatically set as primary if it's the first)
 */
export async function updateAvatar(
  db: SQL,
  character: ComputedCharacter,
  data: Record<string, string>
): Promise<UpdateAvatarResult> {
  // Validate input
  const result = UpdateAvatarSchema.safeParse(data)
  if (!result.success) {
    return { complete: false, errors: zodToFormErrors(result.error) }
  }

  const { upload_id } = result.data

  try {
    // Validate upload exists, is owned by user, and is complete
    await validateUploadForUse(db, upload_id, character.user_id)

    // Create the avatar (database handles primary logic atomically)
    await CharacterAvatars.create(db, {
      character_id: character.id,
      upload_id: upload_id,
    })

    return { complete: true }
  } catch (error) {
    if (error instanceof Error) {
      return { complete: false, errors: { upload_id: error.message } }
    }
    return { complete: false, errors: { upload_id: "Failed to update avatar" } }
  }
}
