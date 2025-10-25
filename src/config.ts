import { dirname } from "node:path"

const repoRoot = dirname(import.meta.dir)

// NOTE: Environment variables mirror this config structure.
// Cloud Run deployments set these env vars via pulumi/app/index.ts
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
  notesAutoSaveDelay: 2000, // 2 seconds
  notesBackupInterval: 300000, // 5 minutes

  smtpHost: process.env.SMTP_HOST || "",
  smtpPort: parseInt(process.env.SMTP_PORT || "25", 10),
  smtpUser: process.env.SMTP_USER || "",
  smtpPassword: process.env.SMTP_PASSWORD || "",
  smtpFrom: process.env.SMTP_FROM || "CSheet <noreply@csheet.net>",

  otpExpiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || "15", 10),
  otpRateLimitPerHour: parseInt(process.env.OTP_RATE_LIMIT_PER_HOUR || "3", 10),

  nodeEnv: process.env.NODE_ENV || "development",

  isProd: process.env.NODE_ENV === "production",
  isTest: process.env.NODE_ENV === "test",
} as const

// Helper to check if SMTP is configured
export function isSmtpConfigured(): boolean {
  return config.isTest || !!config.smtpHost
}

// Print config as JSON when run directly
if (import.meta.main) {
  console.log(JSON.stringify(config, null, 2))
}
