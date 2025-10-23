import * as pulumi from "@pulumi/pulumi"
import * as gcp from "@pulumi/gcp"
import * as random from "@pulumi/random"

const config = new pulumi.Config()

const stack = pulumi.getStack()

// Reference infrastructure stack to get shared resources
const infraStackName = config.require("infraStack")
const infra = new pulumi.StackReference(infraStackName)

// Get infrastructure outputs
const project = infra.getOutput("project")
const region = infra.getOutput("region")
const runtimeServiceAccountEmail = infra.getOutput("runtimeServiceAccountEmail")
const vpcConnectorName = infra.getOutput("vpcConnectorName")
const databaseHost = infra.getOutput("databaseHost")
const databaseName = infra.getOutput("databaseName")
const databaseUser = infra.getOutput("databaseUser")
const databasePassword = infra.getOutput("databasePassword")

// App configuration
const imageRepository = config.require("imageRepository")
const imageTag = config.get("imageTag") ?? "latest"
const image = `${imageRepository}:${imageTag}`
const minInstances = config.getNumber("minInstances") ?? 0
const maxInstances = config.getNumber("maxInstances") ?? 4
const cpu = config.get("cpu") ?? "1"
const memory = config.get("memory") ?? "512Mi"

// S3 configuration
const s3Endpoint = config.require("s3Endpoint")
const s3Region = config.require("s3Region")
const s3AccessKeyId = config.require("s3AccessKeyId")
const s3SecretAccessKey = config.requireSecret("s3SecretAccessKey")
const s3BucketName = config.require("s3BucketName")

// Secrets - created in app stack for easier updates without touching infra
const cookieSecret = new random.RandomPassword("cookie-secret", {
  length: 32,
  special: false, // Avoid special chars for consistency
})

// Helper to create a secret with a value
const createSecret = (name: string, value: pulumi.Input<string>) => {
  const secret = new gcp.secretmanager.Secret(name, {
    secretId: `${stack}-${name}`,
    project,
    replication: {
      auto: {},
    },
  })

  new gcp.secretmanager.SecretVersion(`${name}-version`, {
    secret: secret.id,
    secretData: value,
  })

  // Grant runtime SA access to this secret
  new gcp.secretmanager.SecretIamMember(`${name}-runtime-access`, {
    secretId: secret.id,
    role: "roles/secretmanager.secretAccessor",
    member: pulumi.interpolate`serviceAccount:${runtimeServiceAccountEmail}`,
  })

  return secret
}

// Create secrets for all config values
const secrets = {
  cookieSecret: createSecret("cookie-secret", cookieSecret.result),
  postgresPassword: createSecret("postgres-password", databasePassword),
  postgresHost: createSecret("postgres-host", databaseHost),
  postgresUser: createSecret("postgres-user", databaseUser),
  postgresDb: createSecret("postgres-db", databaseName),
  s3AccessKeyId: createSecret("s3-access-key-id", s3AccessKeyId),
  s3SecretAccessKey: createSecret("s3-secret-access-key", s3SecretAccessKey),
}

// Helper to reference a secret in environment variables
// Using Job type which works for both Service and Job (just requires version: "latest")
const secretEnv = (name: string, secret: gcp.secretmanager.Secret): gcp.types.input.cloudrunv2.JobTemplateTemplateContainerEnv => ({
  name,
  valueSource: {
    secretKeyRef: {
      secret: secret.id,
      version: "latest",
    },
  },
})

// Environment variables matching src/config.ts structure
// Note: Using Job env type works for both Service and Job
const env: pulumi.Input<gcp.types.input.cloudrunv2.JobTemplateTemplateContainerEnv>[] = [
  { name: "NODE_ENV", value: "production" },
  { name: "POSTGRES_PORT", value: "5432" },
  secretEnv("POSTGRES_HOST", secrets.postgresHost),
  secretEnv("POSTGRES_USER", secrets.postgresUser),
  secretEnv("POSTGRES_PASSWORD", secrets.postgresPassword),
  secretEnv("POSTGRES_DB", secrets.postgresDb),
  secretEnv("COOKIE_SECRET", secrets.cookieSecret),
  { name: "S3_ENDPOINT", value: s3Endpoint },
  { name: "S3_REGION", value: s3Region },
  secretEnv("S3_ACCESS_KEY_ID", secrets.s3AccessKeyId),
  secretEnv("S3_SECRET_ACCESS_KEY", secrets.s3SecretAccessKey),
  { name: "S3_BUCKET_NAME", value: s3BucketName },
]

// Migration job - runs dbmate migrate
const migrationJob = new gcp.cloudrunv2.Job("migration-job", {
  name: `${stack}-migrations`,
  location: region,
  project,
  runExecutionToken: `${Date.now()}`, // Triggers migration on every deployment
  template: {
    template: {
      serviceAccount: runtimeServiceAccountEmail,
      containers: [
        {
          image,
          name: "migrations",
          commands: ["/usr/local/bin/run-migrations.sh"],
          args: ["migrate"],
          envs: env,
          resources: {
            limits: {
              cpu,
              memory,
            },
          },
        },
      ],
      vpcAccess: {
        connector: vpcConnectorName,
        egress: "ALL_TRAFFIC",
      },
    },
  },
})

// Cloud Run service
const service = new gcp.cloudrunv2.Service(
  "app-service",
  {
    name: `${stack}-app`,
    location: region,
    project,
    template: {
      serviceAccount: runtimeServiceAccountEmail,
      scaling: {
        minInstanceCount: minInstances,
        maxInstanceCount: maxInstances,
      },
      containers: [
        {
          image,
          name: "web",
          ports: {
            containerPort: 3000,
            name: "http1",
          },
          envs: env,
          resources: {
            cpuIdle: true,
            limits: {
              cpu,
              memory,
            },
          },
        },
      ],
      vpcAccess: {
        connector: vpcConnectorName,
        egress: "ALL_TRAFFIC",
      },
    },
    ingress: "INGRESS_TRAFFIC_ALL",
  },
  { dependsOn: [migrationJob] }
)

export const serviceUrl = service.uri
export const migrationJobName = migrationJob.name
