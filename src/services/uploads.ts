import * as uploads from "@src/db/uploads"
import {
  type CreateUpload,
  isValidContentType,
  isValidSize,
  type Upload,
  UploadStatus,
} from "@src/db/uploads"
import type { SQL } from "bun"
import { fileExists, generatePresignedUploadUrl, generateS3Key, getFileMetadata } from "./s3"

export interface InitiateUploadResult {
  upload: Upload
  uploadUrl: string
}

/**
 * Initiate a new upload
 * Creates a pending upload record and returns a presigned URL
 */
export async function initiateUpload(
  db: SQL,
  userId: string,
  contentType: string,
  sizeBytes: number,
  originalFilename?: string
): Promise<InitiateUploadResult> {
  // Validate content type
  if (!isValidContentType(contentType)) {
    throw new Error(
      `Invalid content type: ${contentType}. Allowed types: ${uploads.ALLOWED_IMAGE_TYPES.join(", ")}`
    )
  }

  // Validate size
  if (!isValidSize(sizeBytes)) {
    throw new Error(
      `Invalid file size: ${sizeBytes} bytes. Maximum allowed: ${uploads.MAX_UPLOAD_SIZE} bytes`
    )
  }

  // Create upload record
  const uploadData: CreateUpload = {
    user_id: userId,
    content_type: contentType as (typeof uploads.ALLOWED_IMAGE_TYPES)[number],
    size_bytes: sizeBytes,
    original_filename: originalFilename,
  }

  const upload = await uploads.create(db, uploadData)

  // Generate S3 key and presigned URL
  const s3Key = generateS3Key(upload.id, contentType)
  const uploadUrl = await generatePresignedUploadUrl(s3Key, contentType)

  // Update upload with s3_key
  await uploads.updateStatus(db, upload.id, UploadStatus.PENDING, s3Key)

  return {
    upload: { ...upload, s3_key: s3Key },
    uploadUrl,
  }
}

/**
 * Complete an upload
 * Verifies the file exists in S3 and marks the upload as complete
 */
export async function completeUpload(db: SQL, uploadId: string, userId: string): Promise<Upload> {
  // Find upload
  const upload = await uploads.findById(db, uploadId)
  if (!upload) {
    throw new Error("Upload not found")
  }

  // Verify ownership
  if (upload.user_id !== userId) {
    throw new Error("Unauthorized: You do not own this upload")
  }

  // Check if already complete
  if (upload.status === UploadStatus.COMPLETE) {
    return upload
  }

  // Verify file exists in S3
  if (!upload.s3_key) {
    throw new Error("Upload has no S3 key")
  }

  const exists = await fileExists(upload.s3_key)
  if (!exists) {
    throw new Error("File not found in storage")
  }

  // Get file metadata to verify
  const metadata = await getFileMetadata(upload.s3_key)

  // Verify content type matches
  if (metadata.contentType !== upload.content_type) {
    throw new Error(
      `Content type mismatch: expected ${upload.content_type}, got ${metadata.contentType}`
    )
  }

  // Verify size is within bounds
  if (metadata.contentLength && !isValidSize(metadata.contentLength)) {
    throw new Error(`File size ${metadata.contentLength} exceeds maximum allowed`)
  }

  // Mark as complete
  const completedUpload = await uploads.updateStatus(db, uploadId, UploadStatus.COMPLETE)
  if (!completedUpload) {
    throw new Error("Failed to update upload status")
  }

  return completedUpload
}

/**
 * Validate an upload for use (e.g., as a character avatar)
 * Checks that upload is complete and valid
 */
export async function validateUploadForUse(
  db: SQL,
  uploadId: string,
  userId: string
): Promise<Upload> {
  const upload = await uploads.findById(db, uploadId)
  if (!upload) {
    throw new Error("Upload not found")
  }

  // Verify ownership
  if (upload.user_id !== userId) {
    throw new Error("Unauthorized: You do not own this upload")
  }

  // Must be complete
  if (upload.status !== UploadStatus.COMPLETE) {
    throw new Error("Upload is not complete")
  }

  // Validate content type (must be image)
  if (!isValidContentType(upload.content_type)) {
    throw new Error("Upload is not a valid image type")
  }

  // Validate size
  if (upload.size_bytes && !isValidSize(upload.size_bytes)) {
    throw new Error("Upload exceeds maximum file size")
  }

  return upload
}

/**
 * Get upload URL for serving
 */
export function getUploadUrl(upload: Upload): string {
  if (!upload.s3_key) {
    throw new Error("Upload has no S3 key")
  }
  // For now, return the direct S3 URL
  // In production with R2, this would be the public URL
  return `/uploads/${upload.id}`
}
