import * as gcp from "@pulumi/gcp"
import * as pulumi from "@pulumi/pulumi"
import * as random from "@pulumi/random"

const config = new pulumi.Config()
const gcpConfig = new pulumi.Config("gcp")

export const project = gcpConfig.require("project")
export const region = gcpConfig.require("region")

const stack = pulumi.getStack()

// enable required APIs (only in prod stack to avoid duplication)
const requiredApis = [
  "compute.googleapis.com",
  "artifactregistry.googleapis.com",
  "cloudresourcemanager.googleapis.com",
  "iam.googleapis.com",
  "run.googleapis.com",
  "secretmanager.googleapis.com",
  "servicenetworking.googleapis.com",
  "sqladmin.googleapis.com",
  "vpcaccess.googleapis.com",
]

const apiEnables =
  stack === "prod"
    ? requiredApis.map((svc) => {
        const name = svc.replace(/\./g, "-")
        return new gcp.projects.Service(name, {
          project,
          service: svc,
          disableOnDestroy: false,
        })
      })
    : []

//
// note: you might have to remove everything below here on the first run if the APIs were not previously enabled
//

// create VPC network
const network = new gcp.compute.Network("vpc", {
  name: `${stack}-network`,
  autoCreateSubnetworks: false,
  project,
})

const mainSubnetCidr = config.get("mainSubnetCidr") ?? "10.10.0.0/20"
new gcp.compute.Subnetwork("app-subnet", {
  ipCidrRange: mainSubnetCidr,
  network: network.id,
  project,
  privateIpGoogleAccess: true,
  region,
  name: `${stack}-subnet`,
})

// vpc connector subnet + connector (traffic from serverless to VPC)
const connectorSubnetCidr = config.get("connectorSubnetCidr") ?? "10.20.0.0/28"
const connectorSubnet = new gcp.compute.Subnetwork("serverless-subnet", {
  ipCidrRange: connectorSubnetCidr,
  network: network.id,
  project,
  purpose: "PRIVATE",
  role: "ACTIVE",
  region,
  name: `${stack}-connector-subnet`,
})

new gcp.vpcaccess.Connector("app-connector", {
  name: `${stack}-vpc-connector`,
  project,
  region,
  subnet: {
    name: connectorSubnet.name,
  },
  minInstances: stack === "prod" ? 2 : 1,
  maxInstances: 3,
})

// private IPs for google-managed services (like Cloud SQL)
const serviceRange = new gcp.compute.GlobalAddress("service-range", {
  addressType: "INTERNAL",
  prefixLength: 16,
  project,
  purpose: "VPC_PEERING",
  network: network.id,
  name: `${stack}-service-range`,
})

const serviceConnection = new gcp.servicenetworking.Connection("service-connection", {
  network: network.id,
  service: "servicenetworking.googleapis.com",
  reservedPeeringRanges: [serviceRange.name],
})

// container registry (shared across all environments)
if (stack === "prod") {
  new gcp.artifactregistry.Repository(
    "repository",
    {
      format: "DOCKER",
      location: region,
      project,
      repositoryId: "csheet",
      description: "Container images for the CSheet application",
    },
    { dependsOn: apiEnables }
  )
}

// service accounts + roles
// service account for running the app (Cloud Run)

const runtimeServiceAccount = new gcp.serviceaccount.Account("app-runtime", {
  accountId: `${stack}-csheet-runtime`,
  displayName: `CSheet Cloud Run runtime (${stack})`,
  project,
})

// Grant runtime SA only the Cloud SQL client role (not broad secret access)
new gcp.projects.IAMMember("runtime-cloudsql-client", {
  member: pulumi.interpolate`serviceAccount:${runtimeServiceAccount.email}`,
  project,
  role: "roles/cloudsql.client",
})

// service account for deployment automation (CI/CD, shared across environments)
let deployServiceAccount: gcp.serviceaccount.Account | undefined
let workloadIdentityProvider: pulumi.Output<string> | undefined

if (stack === "prod") {
  const deploySA = new gcp.serviceaccount.Account("app-deploys", {
    accountId: "csheet-app-deploys",
    displayName: "CSheet deployment automation",
    project,
  })
  deployServiceAccount = deploySA

  const deployRoles = [
    "roles/artifactregistry.writer",
    "roles/run.admin",
    "roles/secretmanager.admin", // Need admin to create/manage secrets during deployment
  ]
  deployRoles.map(
    (role) =>
      new gcp.projects.IAMMember(`deploy-${role.replace(/\./g, "-")}`, {
        member: pulumi.interpolate`serviceAccount:${deploySA.email}`,
        project,
        role,
      })
  )

  // Grant deploy SA access to Pulumi state bucket
  new gcp.storage.BucketIAMMember("deploy-state-access", {
    bucket: "csheet-pulumi-state",
    role: "roles/storage.objectAdmin",
    member: pulumi.interpolate`serviceAccount:${deploySA.email}`,
  })

  // Grant deploy SA access to decrypt Pulumi state secrets
  // The KMS key was created manually: csheet-pulumi/infra in us-central1
  new gcp.kms.CryptoKeyIAMMember("deploy-kms-decrypt", {
    cryptoKeyId: "projects/csheet-475917/locations/us-central1/keyRings/csheet-pulumi/cryptoKeys/infra",
    role: "roles/cloudkms.cryptoKeyDecrypter",
    member: pulumi.interpolate`serviceAccount:${deploySA.email}`,
  })

  // Allow admin user to impersonate the deploy service account (for local testing)
  new gcp.serviceaccount.IAMMember("admin-impersonates-deploy", {
    serviceAccountId: deploySA.name,
    role: "roles/iam.serviceAccountTokenCreator",
    member: "user:igor47@gmail.com",
  })

  // Workload Identity Federation for GitHub Actions
  const githubPool = new gcp.iam.WorkloadIdentityPool("github-pool", {
    workloadIdentityPoolId: "github-actions",
    displayName: "GitHub Actions",
    description: "Identity pool for GitHub Actions workflows",
    project,
  })

  const githubProvider = new gcp.iam.WorkloadIdentityPoolProvider("github-provider", {
    workloadIdentityPoolId: githubPool.workloadIdentityPoolId,
    workloadIdentityPoolProviderId: "github",
    displayName: "GitHub OIDC",
    description: "GitHub Actions OIDC provider",
    project,
    attributeMapping: {
      "google.subject": "assertion.sub",
      "attribute.actor": "assertion.actor",
      "attribute.repository": "assertion.repository",
    },
    attributeCondition: "assertion.repository == 'igor47/csheet'",
    oidc: {
      issuerUri: "https://token.actions.githubusercontent.com",
    },
  })

  // Allow GitHub Actions from igor47/csheet to impersonate the deploy SA
  new gcp.serviceaccount.IAMMember("github-impersonates-deploy", {
    serviceAccountId: deploySA.name,
    role: "roles/iam.workloadIdentityUser",
    member: pulumi.interpolate`principalSet://iam.googleapis.com/${githubPool.name}/attribute.repository/igor47/csheet`,
  })

  // Store references for export
  deployServiceAccount = deploySA
  // Use the provider's name property which includes the correct project number format
  workloadIdentityProvider = githubProvider.name
}

// allow deployer to impersonate runtime SA (deploy SA is created in prod stack)
if (deployServiceAccount) {
  new gcp.serviceaccount.IAMMember("deploy-uses-runtime", {
    member: pulumi.interpolate`serviceAccount:${deployServiceAccount.email}`,
    role: "roles/iam.serviceAccountUser",
    serviceAccountId: runtimeServiceAccount.name,
  })
} else {
  // For non-prod stacks, reference the deploy SA from prod
  const deployEmail = `csheet-app-deploys@${project}.iam.gserviceaccount.com`
  new gcp.serviceaccount.IAMMember("deploy-uses-runtime", {
    member: `serviceAccount:${deployEmail}`,
    role: "roles/iam.serviceAccountUser",
    serviceAccountId: runtimeServiceAccount.name,
  })
}

// Cloud SQL instance
const dbTier = config.get("dbTier") ?? (stack === "prod" ? "db-custom-1-3840" : "db-f1-micro")

const sqlInstance = new gcp.sql.DatabaseInstance(
  "app-db",
  {
    databaseVersion: "POSTGRES_16",
    project,
    region,
    deletionProtection: stack === "prod" ? true : undefined,
    settings: {
      tier: dbTier,
      availabilityType: stack === "prod" ? "REGIONAL" : undefined,
      edition: stack === "prod" ? "ENTERPRISE" : undefined,
      ipConfiguration: {
        privateNetwork: network.id,
        ipv4Enabled: stack === "prod",
        authorizedNetworks: stack === "prod" ? [] : undefined,
      },
      backupConfiguration: {
        enabled: true,
        startTime: "23:00",
        pointInTimeRecoveryEnabled: true,
        location: "us",
        transactionLogRetentionDays: 7,
        backupRetentionSettings: {
          retainedBackups: stack === "prod" ? 30 : 7,
          retentionUnit: stack === "prod" ? "COUNT" : undefined,
        },
      },
      diskAutoresize: true,
    },
  },
  {
    dependsOn: [serviceConnection],
  }
)

// make the db
new gcp.sql.Database("app-db-main", {
  instance: sqlInstance.name,
  name: config.require("postgresDb"),
  project,
})

// make the user
const postgresPassword = new random.RandomPassword("db-password", {
  length: 32,
  special: false, // Avoid special chars that can break URL encoding
})

new gcp.sql.User("app-db-user", {
  instance: sqlInstance.name,
  name: config.require("postgresUser"),
  password: postgresPassword.result,
  project,
})

// Export values for app stack to use
export const runtimeServiceAccountEmail = runtimeServiceAccount.email
export const vpcConnectorName = pulumi.interpolate`projects/${project}/locations/${region}/connectors/${stack}-vpc-connector`
export const databaseHost = sqlInstance.privateIpAddress
export const databaseName = config.require("postgresDb")
export const databaseUser = config.require("postgresUser")
export const databasePassword = pulumi.secret(postgresPassword.result)

// Export Workload Identity and deploy SA (only available in prod stack)
export const githubWorkloadIdentityProvider = workloadIdentityProvider
export const deployServiceAccountEmail = deployServiceAccount?.email
