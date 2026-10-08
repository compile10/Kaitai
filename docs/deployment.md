# Deployment

The beta runs on a single Linux host with Docker Compose (`deploy/compose.yml`):

```
users ──HTTPS──▶ Cloudflare edge ──Cloudflare Tunnel──▶ cloudflared ──▶ web:3000 ──▶ mongo
```

- `web` is the standalone Next.js server built from the `runner` stage of the `Dockerfile`.
- `mongo` is MongoDB 7 as a single-node replica set, stored in the `mongo-data` volume.
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
`mongo-data` volume. Rebuild hosts from a snapshot instead.

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
aws s3api create-bucket --bucket "$BUCKET" --region us-east-1
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
- Outbound HTTPS to Cloudflare, OpenRouter, and (optionally) SigNoz.
- A Cloudflare Tunnel configured like the one in `deploy/infra/main.tf`.

## First deploy

On a provisioned host, connect with `$(tofu output -raw ssh)` and wait for the
first-boot script with `cloud-init status --wait`. Then:

```bash
git clone <repo> kaitai && cd kaitai
cp deploy/.env.production.example deploy/.env.production
chmod 600 deploy/.env.production   # fill in the values
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
password stays out of the command line:

```bash
read -r ADMIN_EMAIL && read -r ADMIN_NAME && read -rs ADMIN_PASSWORD
export ADMIN_EMAIL ADMIN_NAME ADMIN_PASSWORD
docker compose -f deploy/compose.yml run --rm --build seed
```

## Operations

| Task | Command |
| --- | --- |
| Redeploy | `git pull && docker compose -f deploy/compose.yml up -d --build` |
| Status | `docker compose -f deploy/compose.yml ps` |
| Logs | `docker compose -f deploy/compose.yml logs -f web` |
| Health | `curl https://kaitai.app/api/health` |

Redeploys restart `web` and briefly interrupt requests. Container logs rotate at
3 × 10 MB per service. The `mongo-data` volume holds all application data;
Lightsail's daily snapshots back it up. Rehearse a restore by creating an
instance from a snapshot.
