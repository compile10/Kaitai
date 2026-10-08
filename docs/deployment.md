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

## Host requirements

- Docker Engine with the Compose v2 plugin.
- 2 GB RAM. The running stack uses roughly 200 MB, but `next build` needs more;
  add 2 GB of swap if building on the host.
- Outbound HTTPS to Cloudflare, OpenRouter, and (optionally) SigNoz.

## Cloudflare Tunnel

Create a remotely managed tunnel whose public hostname `kaitai.app` routes to
`http://web:3000`, with a catch-all `http_status:404` rule, and a proxied DNS
record pointing at the tunnel. Copy the tunnel token for the host.

In the zone, keep these features off; they inject or rewrite scripts that the
nonce-based Content Security Policy blocks:

- Rocket Loader
- Email Address Obfuscation

Also keep **Bot Fight Mode** off. On the Free plan it can challenge mobile API
requests and cannot be bypassed with rules.

Cloudflare returns HTTP 524 if the origin takes longer than 100 seconds. Normal
analyses finish well within that, but a slow model call that retries, or an
image extraction followed by analysis, can exceed it.

## First deploy

```bash
git clone <repo> kaitai && cd kaitai
cp deploy/.env.production.example deploy/.env.production
chmod 600 deploy/.env.production   # fill in the values
install -m 600 /dev/null deploy/.env.tunnel
echo 'TUNNEL_TOKEN=<token>' > deploy/.env.tunnel
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
3 × 10 MB per service. Back up the host disk (for example, with provider
snapshots); the `mongo-data` volume holds all application data.
