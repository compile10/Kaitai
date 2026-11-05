# Deployment

The beta runs on a single Linux host with Docker Compose (`deploy/compose.yml`):

```
users ──HTTPS──▶ Cloudflare edge ──Cloudflare Tunnel──▶ cloudflared ──▶ web:3000 ──▶ postgres
```

- `web` is the standalone Next.js server built from the `runner` stage of the `Dockerfile`.
- `postgres` is the official PostgreSQL 17 image plus pg_cron (`postgres/Dockerfile`),
  stored in the `postgres-data` volume. Its password comes from `deploy/.env`.
  pg_cron jobs from `postgres/migrations/003_expiry_jobs.sql` delete expired invites and
  rate-limit counters; check them with `SELECT * FROM cron.job_run_details
  ORDER BY start_time DESC LIMIT 20;`.
- `migrate` runs `scripts/migrate.mjs` from the `builder` stage and applies the
  SQL files in `postgres/migrations/` before `web` starts. Migrations are forward-only;
  add a new numbered file rather than editing an applied one.
- `cloudflared` makes an outbound-only connection to Cloudflare. The host publishes
  no ports, so Cloudflare terminates TLS and the tunnel is the only way in.
- `seed` (profile `tools`) runs `scripts/seed-admin.mjs` from the `builder` stage.

Because every request arrives through Cloudflare, `RATE_LIMIT_IP_HEADER` is
`cf-connecting-ip`; Cloudflare overwrites any client-supplied value. Do not
publish the `web` port or route other proxies to it, or clients could forge that
header.

## Infrastructure

`deploy/infra/` is an OpenTofu configuration that provisions:

- An AWS Lightsail instance (Ubuntu 24.04, `small_3_0`: 2 GB RAM, $12/month)
  with a static IP, daily automatic snapshots, and a first-boot script that
  adds swap and installs Docker. Only SSH is open, and only to `ssh_cidrs`.
- An account-wide AWS budget alert.
- A remotely managed Cloudflare Tunnel routing `kaitai.app` to `http://web:3000`,
  a proxied apex CNAME to the tunnel, and zone settings: Always Use HTTPS,
  minimum TLS 1.2, and Rocket Loader and Email Address Obfuscation off (both
  inject or rewrite scripts that the nonce-based Content Security Policy blocks).

Application secrets and the tunnel token never enter OpenTofu state.

The instance has `prevent_destroy`, because replacing it deletes the
`postgres-data` volume. Rebuild hosts from a snapshot instead.

### Prerequisites

- OpenTofu 1.10 or later and AWS CLI credentials for the target account.
- A dedicated SSH key: `ssh-keygen -t ed25519 -f ~/.ssh/kaitai-beta`
- A Cloudflare API token, exported as `CLOUDFLARE_API_TOKEN`, with
  **Account → Cloudflare Tunnel → Edit** and, for the `kaitai.app` zone,
  **Zone → Read**, **DNS → Edit**, and **Zone Settings → Edit**.
- No existing apex A, AAAA, or CNAME record for the domain. Delete it, or
  `tofu import` it into `cloudflare_dns_record.apex`.

Zone settings apply to every hostname in the zone.

### Provision

Create the state bucket once:

```bash
BUCKET=kaitai-tofu-state-$(aws sts get-caller-identity --query Account --output text)
aws s3api create-bucket --bucket "$BUCKET" --region us-west-2 \
  --create-bucket-configuration LocationConstraint=us-west-2
aws s3api put-bucket-versioning --bucket "$BUCKET" \
  --versioning-configuration Status=Enabled
```

Then apply:

```bash
cd deploy/infra
cp terraform.tfvars.example terraform.tfvars   # fill in
tofu init -backend-config="bucket=$BUCKET"
tofu plan -out beta.tfplan
tofu apply beta.tfplan
```

Re-run `tofu plan` after console changes to detect drift.

## Cloudflare

Keep **Bot Fight Mode** off. On the Free plan it can challenge mobile API
requests and cannot be bypassed with rules.

Cloudflare returns HTTP 524 if the origin takes longer than 100 seconds. Normal
analyses finish well within that, but a slow model call that retries, or an
image extraction followed by analysis, can exceed it.

## Host requirements

For hosts not provisioned by `deploy/infra/`:

- Docker Engine with the Compose v2 plugin.
- 2 GB RAM. The running stack uses roughly 200 MB, but `next build` needs more;
  add 2 GB of swap if building on the host.
- Outbound HTTPS to Cloudflare, OpenRouter, and (optionally) Grafana Cloud.
- A Cloudflare Tunnel configured like the one in `deploy/infra/main.tf`.

## First deploy

On a provisioned host, connect with `$(tofu output -raw ssh)` and wait for the
first-boot script with `cloud-init status --wait`. Then:

```bash
git clone <repo> kaitai && cd kaitai
cp deploy/.env.production.example deploy/.env.production
cp deploy/.env.example deploy/.env
chmod 600 deploy/.env.production deploy/.env   # fill in the values
```

Write the tunnel token to `deploy/.env.tunnel` as `TUNNEL_TOKEN=<token>` with
mode 600. From `deploy/infra/` on the provisioning machine, this streams it
without writing it locally:

```bash
eval "$(tofu output -raw tunnel_token_command)" | $(tofu output -raw ssh) \
  'umask 077 && sed "s/^/TUNNEL_TOKEN=/" > kaitai/deploy/.env.tunnel'
```

Start the stack on the host:

```bash
docker compose -f deploy/compose.yml up -d --build
```

Create the first admin. The variables pass through from the shell, so the
password stays out of the command line, and are cleared afterward:

```bash
read -r ADMIN_EMAIL && read -r ADMIN_NAME && read -rs ADMIN_PASSWORD
export ADMIN_EMAIL ADMIN_NAME ADMIN_PASSWORD
docker compose -f deploy/compose.yml run --rm --build seed
unset ADMIN_EMAIL ADMIN_NAME ADMIN_PASSWORD
```

## Operations

| Task | Command |
| --- | --- |
| Redeploy | `git pull && docker compose -f deploy/compose.yml up -d --build` |
| Status | `docker compose -f deploy/compose.yml ps` |
| Logs | `docker compose -f deploy/compose.yml logs -f web` |
| Health | `curl https://kaitai.app/api/health` |

Redeploys restart `web` and briefly interrupt requests. Container logs rotate at
3 × 10 MB per service. The `postgres-data` volume holds all application data;
Lightsail's daily snapshots back it up. Rehearse a restore by creating an
instance from a snapshot. For a logical backup:
`docker compose -f deploy/compose.yml exec -T postgres pg_dump -U kaitai -Fc kaitai > kaitai.dump`

## MongoDB → PostgreSQL cutover

One-time move of the existing MongoDB data. It takes a few minutes of downtime.
User, account, and session IDs keep their Mongo ObjectId hex values, so signed-in
web and mobile sessions stay valid.

1. Snapshot the instance in Lightsail.
2. Create `deploy/.env` from `deploy/.env.example`, then pull the new code.
3. Stop the old app, keeping its data volume:
   `docker compose -f deploy/compose.yml stop web cloudflared`
4. Copy the data. This starts Postgres and Mongo, applies migrations, and copies
   every table in one transaction. It prints per-table counts; `skipped` rows
   referenced deleted users. A failed copy rolls back completely and can be run
   again. The copy refuses to run once Postgres has users.
   `docker compose -f deploy/compose.yml -f deploy/compose.mongo-cutover.yml run --rm --build copy-from-mongo`
5. Start the new stack. This removes the `mongo` container:
   `docker compose -f deploy/compose.yml up -d --build --remove-orphans`
6. Check `/api/health`, sign in with an existing account, confirm a signed-in
   mobile session still works, and check history, settings, and invite creation.
   If something is wrong, check out the previous release and run step 5 again;
   the copy leaves the Mongo data untouched. Before retrying the cutover, delete
   the partial Postgres data with `docker volume rm deploy_postgres-data` so the
   copy starts from current Mongo data.
7. Delete the Mongo data: `docker volume rm deploy_mongo-data`. From here, the
   step 1 snapshot is the only way back.

Then remove the cutover tooling from the repo: `deploy/compose.mongo-cutover.yml`,
`scripts/migrate-mongo-to-postgres.mjs`, the `db:copy-from-mongo` script, the
`mongodb` dev dependency, and this section.
