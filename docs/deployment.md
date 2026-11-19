# Deployment

The beta runs on a single Linux host with Docker Compose (`deploy/compose.yml`):

```
users ──HTTPS──▶ Cloudflare edge ──Cloudflare Tunnel──▶ cloudflared ──▶ caddy:80 ──▶ web:3000 ──▶ postgres
```

- `web` is the standalone Next.js server built from the `runner` stage of the `Dockerfile`.
- `caddy` (`deploy/Caddyfile`) proxies to every running `web` container and
  retries failed connections on another one, so deploys can replace `web`
  without dropping requests.
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
publish the `caddy` or `web` ports or route other proxies to them, or clients
could forge that header.

## Infrastructure

`deploy/infra/` is an OpenTofu configuration that provisions:

- An AWS Lightsail instance (Ubuntu 24.04, `small_3_0`: 2 GB RAM, $12/month)
  with a static IP, daily automatic snapshots, and a first-boot script that
  adds swap and installs Docker. Only SSH is open, and only to `ssh_cidrs`.
- An account-wide AWS budget alert.
- A remotely managed Cloudflare Tunnel routing `kaitai.app` to `http://caddy:80`
  and `ssh.kaitai.app` to the host's sshd, proxied CNAMEs for both, a Cloudflare
  Access application that admits only the deploy service token to
  `ssh.kaitai.app`, and zone settings: Always Use HTTPS,
  minimum TLS 1.2, and Rocket Loader and Email Address Obfuscation off (both
  inject or rewrite scripts that the nonce-based Content Security Policy blocks).

Application secrets, the tunnel token, and the Access service token secret
never enter OpenTofu state.

The instance has `prevent_destroy`, because replacing it deletes the
`postgres-data` volume. Rebuild hosts from a snapshot instead.

### Prerequisites

- OpenTofu 1.10 or later and AWS CLI credentials for the target account.
- A dedicated SSH key: `ssh-keygen -t ed25519 -f ~/.ssh/kaitai-beta`
- A Cloudflare API token, exported as `CLOUDFLARE_API_TOKEN`, with
  **Account → Cloudflare Tunnel → Edit**, **Account → Access: Apps and
  Policies → Edit**, and, for the `kaitai.app` zone,
  **Zone → Read**, **DNS → Edit**, and **Zone Settings → Edit**.
- No existing apex A, AAAA, or CNAME record for the domain. Delete it, or
  `tofu import` it into `cloudflare_dns_record.apex`.
- Cloudflare Zero Trust enabled on the account (the free plan is enough) and
  a service token from **Access → Service credentials**. Put its ID (not the
  Client ID) in `deploy_service_token_id`, and keep the Client ID and Client
  Secret for GitHub. Service tokens expire; renew it before then.

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
aws s3 cp terraform.tfvars "s3://$BUCKET/beta/terraform.tfvars" --sse AES256
tofu init -backend-config="bucket=$BUCKET"
tofu plan -out beta.tfplan
tofu apply beta.tfplan
```

`terraform.tfvars` is gitignored; the copy next to the state is the source of
truth. On another machine, fetch it before planning:

```bash
aws s3 cp "s3://$BUCKET/beta/terraform.tfvars" deploy/infra/
```

After editing it, upload it again with the first `aws s3 cp` command.

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

## Continuous deployment

`.github/workflows/deploy.yml` deploys every push to `main`:

1. The `build` job builds the `runner` and `builder` stages and pushes them to
   GHCR as `kaitai-web` and `kaitai-tools`, tagged with the commit.
2. The `deploy` job runs in the `production` environment. It reaches the
   host's sshd through the Cloudflare Tunnel at `ssh.kaitai.app`, where Access
   admits only the deploy service token. The Lightsail firewall is unchanged.
3. It connects with a key that can only run `deploy/deploy.sh`. The script
   checks that the commit is on `main`, checks it out, pulls both images by
   digest with the job's short-lived registry token, and tags them `:current`.
   It then runs migrations and replaces `web` without downtime (below).
4. The job then checks `https://kaitai.app/api/health`.

The host never builds the app and holds no GitHub credential. GitHub holds no
AWS credentials; reaching the host takes both the Access service token and the
restricted deploy key. Runs
are serialized; a newer push replaces a queued one. To redeploy `main`, run
the workflow from the Actions tab.

`deploy.sh` refuses a commit older than the one deployed, recorded in
`.git/kaitai-deployed` on the host, so re-running an old workflow run cannot
roll production back. To roll back, revert on `main`. After a successful
deploy it deletes every other `kaitai-web` and `kaitai-tools` image.

### Zero-downtime deploys

`deploy.sh` replaces `web` with [docker-rollout](https://github.com/wowu/docker-rollout),
which it downloads on first use, pinned and checksummed. Rollout starts a
second `web` container, waits for it to pass its healthcheck, then stops the
old one. Caddy re-resolves `web` every second and retries any request whose
connection is refused, so requests reach whichever container is up. On
`SIGTERM`, Next.js stops accepting connections and finishes in-flight requests
within `stop_grace_period` (90 s). If the new container never becomes healthy,
rollout removes it and the old one keeps serving.

While both run, `web` uses twice its usual memory. Migrations run before the
swap, so the old container briefly serves against the new schema; keep
migrations backward compatible with the previous release.

A change to `postgres`, `caddy`, or `cloudflared` still restarts that service.

### Setup

On an existing host, update the checkout and start Caddy before applying the
tunnel change, so `kaitai.app` has an origin when it switches to `caddy:80`.
Recreating `cloudflared` gives it the route to the host's sshd and briefly
drops the tunnel:

```bash
cd ~/kaitai && git fetch && git checkout --detach origin/main
docker compose -f deploy/compose.yml up -d --no-build --no-deps caddy cloudflared
```

Then run `tofu apply` from your machine.

Create a deploy key on your machine (not the host):

```bash
ssh-keygen -t ed25519 -N '' -C kaitai-github-deploy -f kaitai-deploy
```

On the host, authorize it for the deploy script only, and print the host key
line that GitHub will pin:

```bash
read -r pubkey   # paste the contents of kaitai-deploy.pub
echo "restrict,command=\"$HOME/kaitai/deploy/deploy.sh\" $pubkey" >> ~/.ssh/authorized_keys
echo "ssh.kaitai.app $(cut -d' ' -f1,2 /etc/ssh/ssh_host_ed25519_key.pub)"
```

In GitHub, create a `production` environment with deployment branches limited
to `main`, then add:

| Kind | Name | Value |
| --- | --- | --- |
| Secret | `DEPLOY_SSH_KEY` | Contents of `kaitai-deploy` |
| Secret | `CF_ACCESS_CLIENT_ID` | Service token Client ID |
| Secret | `CF_ACCESS_CLIENT_SECRET` | Service token Client Secret |
| Variable | `DEPLOY_KNOWN_HOSTS` | The host key line printed above |

```bash
gh api -X PUT repos/{owner}/{repo}/environments/production \
  -F 'deployment_branch_policy[protected_branches]=false' \
  -F 'deployment_branch_policy[custom_branch_policies]=true'
gh api -X POST repos/{owner}/{repo}/environments/production/deployment-branch-policies \
  -f name=main -f type=branch
gh secret set DEPLOY_SSH_KEY --env production < kaitai-deploy
gh secret set CF_ACCESS_CLIENT_ID --env production       # paste when prompted
gh secret set CF_ACCESS_CLIENT_SECRET --env production   # paste when prompted
gh variable set DEPLOY_KNOWN_HOSTS --env production --body "<host key line>"
rm kaitai-deploy kaitai-deploy.pub
```

To approve each deploy by hand, add required reviewers to the environment.
Branch protection on `main` keeps unreviewed commits out of production.

After the first workflow deploy, the host checkout is a detached `HEAD`.

The Lightsail SSH rule for `ssh_cidrs` stays as a direct path for admins,
independent of the tunnel.

## Operations

| Task | Command |
| --- | --- |
| Redeploy | Run the Deploy workflow, or `git fetch && git checkout --detach origin/main && docker compose -f deploy/compose.yml up -d --build` |
| Status | `docker compose -f deploy/compose.yml ps` |
| Logs | `docker compose -f deploy/compose.yml logs -f web` |
| Health | `curl https://kaitai.app/api/health` |

Manual `--build` deploys build on the host and replace the `:current` images
until the next workflow deploy. Manual `up` recreates `web` directly and briefly
interrupts requests; the workflow does not. Container logs rotate at
3 × 10 MB per service. The `postgres-data` volume holds all application data;
Lightsail's daily snapshots back it up. Rehearse a restore by creating an
instance from a snapshot. For a logical backup:
`docker compose -f deploy/compose.yml exec -T postgres pg_dump -U kaitai -Fc kaitai > kaitai.dump`
