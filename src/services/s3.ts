import {
  GetObjectCommand,
  type GetObjectCommandInput,
  HeadObjectCommand,
  type HeadObjectCommandInput,
  PutObjectCommand,
  type PutObjectCommandInput,
  S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { config } from "@src/config"

// Initialize S3 client
const s3Client = new S3Client({
  endpoint: config.s3Endpoint,
  region: config.s3Region,
  credentials: {
    accessKeyId: config.s3AccessKeyId,
    secretAccessKey: config.s3SecretAccessKey,
  },
  forcePathStyle: true, // Required for MinIO
})

/**
 * Generate a presigned URL for uploading a file to S3
 * @param key - S3 object key (file path in bucket)
 * @param contentType - MIME type of the file
 * @param expiresIn - URL expiration time in seconds (default: 15 minutes)
 * @returns Presigned URL for PUT request
 */
export async function generatePresignedUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 900 // 15 minutes
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: config.s3BucketName,
    Key: key,
    ContentType: contentType,
  } as PutObjectCommandInput)

  return await getSignedUrl(s3Client, command, { expiresIn })
}

/**
 * Check if a file exists in S3
 * @param key - S3 object key
 * @returns true if file exists, false otherwise
 */
export async function fileExists(key: string): Promise<boolean> {
  try {
    await s3Client.send(
      new HeadObjectCommand({
        Bucket: config.s3BucketName,
        Key: key,
      } as HeadObjectCommandInput)
    )
    return true
  } catch (_error) {
    return false
  }
}

/**
 * Get file metadata from S3
 * @param key - S3 object key
 * @returns File metadata (size, content type, etc.)
 */
export async function getFileMetadata(key: string) {
  const response = await s3Client.send(
    new HeadObjectCommand({
      Bucket: config.s3BucketName,
      Key: key,
    } as HeadObjectCommandInput)
  )

  return {
    contentType: response.ContentType,
    contentLength: response.ContentLength,
    lastModified: response.LastModified,
    etag: response.ETag,
  }
}

/**
 * Get a file from S3
 * @param key - S3 object key
 * @returns File stream and metadata
 */
export async function getFile(key: string) {
  const response = await s3Client.send(
    new GetObjectCommand({
      Bucket: config.s3BucketName,
      Key: key,
    } as GetObjectCommandInput)
  )

  return {
    body: response.Body,
    contentType: response.ContentType,
    contentLength: response.ContentLength,
  }
}

/**
 * Generate S3 key for an upload
 * @param uploadId - Upload ID (ULID)
 * @param contentType - MIME type
 * @returns S3 key path
 */
export function generateS3Key(uploadId: string, contentType: string): string {
  const extension = contentType.split("/")[1] || "bin"
  return `uploads/${uploadId}.${extension}`
}
