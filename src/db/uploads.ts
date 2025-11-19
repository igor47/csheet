import { ulid } from "@src/lib/ids"
import type { SQL } from "bun"
import { z } from "zod"

// Upload status enum
export const UploadStatus = {
  PENDING: "pending",
  COMPLETE: "complete",
  FAILED: "failed",
} as const

export type UploadStatusType = (typeof UploadStatus)[keyof typeof UploadStatus]

// Allowed content types for uploads
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const

export const MAX_UPLOAD_SIZE = 5 * 1024 * 1024 // 5MB

// Zod schemas
export const UploadSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  status: z.enum([UploadStatus.PENDING, UploadStatus.COMPLETE, UploadStatus.FAILED]),
  content_type: z.string(),
  size_bytes: z.number().nullable(),
  original_filename: z.string().nullable(),
  s3_key: z.string().nullable(),
  created_at: z.date(),
  completed_at: z.date().nullable(),
})

export const CreateUploadSchema = z.object({
  user_id: z.string(),
  content_type: z.enum(ALLOWED_IMAGE_TYPES as unknown as readonly [string, ...string[]]),
  size_bytes: z.number().max(MAX_UPLOAD_SIZE),
  original_filename: z.string().optional(),
})

export type Upload = z.infer<typeof UploadSchema>
export type CreateUpload = z.infer<typeof CreateUploadSchema>

/**
 * Create a new upload record
 */
export async function create(db: SQL, upload: CreateUpload): Promise<Upload> {
  const id = ulid()

  const result = await db`
    INSERT INTO uploads (id, user_id, status, content_type, size_bytes, original_filename)
    VALUES (
      ${id},
      ${upload.user_id},
      ${UploadStatus.PENDING},
      ${upload.content_type},
      ${upload.size_bytes},
      ${upload.original_filename ?? null}
    )
    RETURNING *
  `

  const row = result[0]
  return UploadSchema.parse({
    ...row,
    size_bytes: row.size_bytes ? Number(row.size_bytes) : null,
    created_at: new Date(row.created_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  })
}

/**
 * Find upload by ID
 */
export async function findById(db: SQL, id: string): Promise<Upload | null> {
  const result = await db`
    SELECT * FROM uploads
    WHERE id = ${id}
    LIMIT 1
  `

  if (!result[0]) return null

  const row = result[0]
  return UploadSchema.parse({
    ...row,
    size_bytes: row.size_bytes ? Number(row.size_bytes) : null,
    created_at: new Date(row.created_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  })
}

/**
 * Update upload status and s3_key
 */
export async function updateStatus(
  db: SQL,
  id: string,
  status: UploadStatusType,
  s3Key?: string
): Promise<Upload | null> {
  const result = await db`
    UPDATE uploads
    SET status = ${status},
        s3_key = COALESCE(${s3Key ?? null}, s3_key),
        completed_at = ${status === UploadStatus.COMPLETE ? new Date() : null}
    WHERE id = ${id}
    RETURNING *
  `

  if (!result[0]) return null

  const row = result[0]
  return UploadSchema.parse({
    ...row,
    size_bytes: row.size_bytes ? Number(row.size_bytes) : null,
    created_at: new Date(row.created_at),
    completed_at: row.completed_at ? new Date(row.completed_at) : null,
  })
}

/**
 * Find uploads by user ID
 */
export async function findByUserId(db: SQL, userId: string): Promise<Upload[]> {
  const result = await db`
    SELECT * FROM uploads
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
  `

  return result.map((row: Upload) =>
    UploadSchema.parse({
      ...row,
      size_bytes: row.size_bytes ? Number(row.size_bytes) : null,
      created_at: new Date(row.created_at),
      completed_at: row.completed_at ? new Date(row.completed_at) : null,
    })
  )
}

/**
 * Validate if content type is allowed
 */
export function isValidContentType(contentType: string): boolean {
  return ALLOWED_IMAGE_TYPES.includes(contentType as (typeof ALLOWED_IMAGE_TYPES)[number])
}

/**
 * Validate if size is within limits
 */
export function isValidSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_UPLOAD_SIZE
}
