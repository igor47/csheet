import { dirname } from "node:path"

const repoRoot = dirname(import.meta.dir)

export const config = {
  repoRoot,
  postgresHost: process.env.POSTGRES_HOST || "localhost",
  postgresPort: process.env.POSTGRES_PORT || "5432",
  postgresUser: process.env.POSTGRES_USER || "csheet_user",
  postgresPassword: process.env.POSTGRES_PASSWORD || "csheet_pass",
  postgresDb: process.env.POSTGRES_DB || "csheet_dev",
  postgresDbTest: process.env.POSTGRES_DB_TEST || "csheet_test",
  cookieSecret: process.env.COOKIE_SECRET || "your-secret-key-should-be-in-env",
  s3Endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  s3Region: process.env.S3_REGION || "us-east-1",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID || "csheet_minio",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "csheet_minio_pass",
  s3BucketName: process.env.S3_BUCKET_NAME || "csheet-uploads",
  s3BucketNameTest: process.env.S3_BUCKET_NAME_TEST || "csheet-uploads-test",
  s3PublicUrl: process.env.S3_PUBLIC_URL || "http://localhost:9000/csheet-uploads",
  notesAutoSaveDelay: 2000, // 2 seconds
  notesBackupInterval: 300000, // 5 minutes
} as const

// Print config as JSON when run directly
if (import.meta.main) {
  console.log(JSON.stringify(config, null, 2))
}
