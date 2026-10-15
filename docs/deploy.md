# Deployment and operations

Google Cloud Run, project `csheet-475917`, region `us-central1`, managed by two Pulumi stacks with
state in the `csheet-pulumi-state` GCS bucket:

- `pulumi/infra/`: VPC, Cloud SQL, service accounts, Workload Identity Federation.
- `pulumi/app/`: the Cloud Run service `prod-app`, the migration job, secrets.

## Releases

Creating a **GitHub release** (which creates a tag) triggers `.github/workflows/deploy.yml`:
authenticate via Workload Identity Federation (no stored keys; only the `igor47/csheet` repo may
deploy), build the image tagged with the first 12 characters of the commit SHA, push it to Artifact
Registry, run migrations as a Cloud Run job, then deploy the service. Release notes are written for
players: narrative paragraphs for features, bullets for a grab-bag, synthesized from the commits
rather than listing them.

Backfill scripts (`utils/backfill-*.ts`, `mise run utils:backfill-*`) are run by hand right after
the deploy that needs them, against prod through the Cloud SQL proxy (`mise run db:prod:proxy`, then
`--prod`). Keep them simple: idempotent, a progress log, and an exit code. No locks or dry-run flags.

## Commands

```bash
mise run infra:preview | infra:up           # infrastructure stack
mise run deploy:preview | deploy:push | deploy:up   # app stack, by hand (CI does this on release)
bin/as-deploy.sh mise run deploy:up         # as the deploy service account, to verify permissions
mise run ops:logs                           # tail production logs
mise run db:prod:psql                       # psql against production
mise run db:prod:proxy                      # Cloud SQL proxy on localhost:5433
mise run utils:activity -- --period 7 --prod
```

Production logs: https://console.cloud.google.com/run/detail/us-central1/prod-app/logs. Errors with
stack traces reach Error Reporting via the structured logger.

## CI

`.github/workflows/dev.yml` runs on pull requests and on `main`: **Lint** (`mise run check`: Biome
and `tsc --noEmit`) and **Test** (`mise run test`). Both must pass before `main` can move.
