import { beginOrSavepoint } from "@src/db"
import type { SQL, TransactionSQL } from "bun"
import { ulid } from "ulid"
import { z } from "zod"

// Zod schemas
export const CropPercentsSchema = z.object({
  crop_x_percent: z.number().min(0).max(1),
  crop_y_percent: z.number().min(0).max(1),
  crop_width_percent: z.number().min(0).max(1),
  crop_height_percent: z.number().min(0).max(1),
})

export const CharacterAvatarSchema = z.object({
  id: z.string(),
  character_id: z.string(),
  upload_id: z.string(),
  is_primary: z.boolean(),
  crop_x_percent: z.number().min(0).max(1).nullable(),
  crop_y_percent: z.number().min(0).max(1).nullable(),
  crop_width_percent: z.number().min(0).max(1).nullable(),
  crop_height_percent: z.number().min(0).max(1).nullable(),
  created_at: z.date(),
  updated_at: z.date(),
})

export const CreateCharacterAvatarSchema = z.object({
  character_id: z.string(),
  upload_id: z.string(),
  is_primary: z.boolean().optional(),
  crop_x_percent: z.number().min(0).max(1).optional(),
  crop_y_percent: z.number().min(0).max(1).optional(),
  crop_width_percent: z.number().min(0).max(1).optional(),
  crop_height_percent: z.number().min(0).max(1).optional(),
})

export const UpdateCropSchema = z.object({
  crop_x_percent: z.number().min(0).max(1),
  crop_y_percent: z.number().min(0).max(1),
  crop_width_percent: z.number().min(0).max(1),
  crop_height_percent: z.number().min(0).max(1),
})

export type CharacterAvatar = z.infer<typeof CharacterAvatarSchema>
export type CreateCharacterAvatar = z.infer<typeof CreateCharacterAvatarSchema>
export type UpdateCrop = z.infer<typeof UpdateCropSchema>
export type CropPercents = z.infer<typeof CropPercentsSchema>

/**
 * Create a new character avatar
 * Automatically sets is_primary to TRUE if it's the first avatar for the character
 * This check is done atomically in the database to avoid race conditions
 */
export async function create(db: SQL, avatar: CreateCharacterAvatar): Promise<CharacterAvatar> {
  const id = ulid()

  const result = await db`
    INSERT INTO character_avatars (
      id,
      character_id,
      upload_id,
      is_primary,
      crop_x_percent,
      crop_y_percent,
      crop_width_percent,
      crop_height_percent
    )
    VALUES (
      ${id},
      ${avatar.character_id},
      ${avatar.upload_id},
      COALESCE(
        ${avatar.is_primary ?? null}::boolean,
        NOT EXISTS(
          SELECT 1 FROM character_avatars WHERE character_id = ${avatar.character_id}
        )
      ),
      ${avatar.crop_x_percent ?? null},
      ${avatar.crop_y_percent ?? null},
      ${avatar.crop_width_percent ?? null},
      ${avatar.crop_height_percent ?? null}
    )
    RETURNING *
  `

  const row = result[0]
  return CharacterAvatarSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

/**
 * Find avatar by ID
 */
export async function findById(db: SQL, id: string): Promise<CharacterAvatar | null> {
  const result = await db`
    SELECT * FROM character_avatars
    WHERE id = ${id}
    LIMIT 1
  `

  if (!result[0]) return null

  const row = result[0]
  return CharacterAvatarSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

/**
 * Find all avatars for a character, ordered by primary first, then by creation date
 */
export async function findByCharacterId(db: SQL, characterId: string): Promise<CharacterAvatar[]> {
  const result = await db`
    SELECT * FROM character_avatars
    WHERE character_id = ${characterId}
    ORDER BY is_primary DESC, created_at DESC
  `

  return result.map((row: CharacterAvatar) =>
    CharacterAvatarSchema.parse({
      ...row,
      created_at: new Date(row.created_at),
      updated_at: new Date(row.updated_at),
    })
  )
}

/**
 * Find the primary avatar for a character
 */
export async function findPrimaryByCharacterId(
  db: SQL,
  characterId: string
): Promise<CharacterAvatar | null> {
  const result = await db`
    SELECT * FROM character_avatars
    WHERE character_id = ${characterId} AND is_primary = TRUE
    LIMIT 1
  `

  if (!result[0]) return null

  const row = result[0]
  return CharacterAvatarSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

/**
 * Set an avatar as primary for a character (atomically unsets others)
 */
export async function setPrimary(db: SQL, characterId: string, avatarId: string): Promise<void> {
  await beginOrSavepoint(db, async (tx: TransactionSQL) => {
    // Unset all other avatars for this character
    await tx`
      UPDATE character_avatars
      SET is_primary = FALSE
      WHERE character_id = ${characterId}
    `

    // Set the specified avatar as primary
    await tx`
      UPDATE character_avatars
      SET is_primary = TRUE, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${avatarId} AND character_id = ${characterId}
    `
  })
}

/**
 * Update crop coordinates for an avatar
 */
export async function updateCrop(
  db: SQL,
  avatarId: string,
  crop: UpdateCrop
): Promise<CharacterAvatar | null> {
  const result = await db`
    UPDATE character_avatars
    SET crop_x_percent = ${crop.crop_x_percent},
        crop_y_percent = ${crop.crop_y_percent},
        crop_width_percent = ${crop.crop_width_percent},
        crop_height_percent = ${crop.crop_height_percent},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${avatarId}
    RETURNING *
  `

  if (!result[0]) return null

  const row = result[0]
  return CharacterAvatarSchema.parse({
    ...row,
    created_at: new Date(row.created_at),
    updated_at: new Date(row.updated_at),
  })
}

/**
 * Delete an avatar
 */
export async function deleteAvatar(db: SQL, avatarId: string): Promise<boolean> {
  const result = await db`
    DELETE FROM character_avatars
    WHERE id = ${avatarId}
    RETURNING id
  `

  return result.length > 0
}

/**
 * Count avatars for a character
 */
export async function countByCharacterId(db: SQL, characterId: string): Promise<number> {
  const result = await db`
    SELECT COUNT(*) as count FROM character_avatars
    WHERE character_id = ${characterId}
  `

  return Number(result[0].count)
}
