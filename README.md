<img width="1622" height="959" alt="localhost_3000_" src="https://github.com/user-attachments/assets/c158d1ce-ee94-41f4-a4e3-ecb54d22c538" />

AI-powered Japanese sentence breakdown and visualization. Available as a **Next.js web app** and a **React Native (Expo) mobile app**.

## Features

- AI-powered Japanese sentence analysis
- Interactive dependency visualization (React Flow on web, SVG on mobile)
- Image upload — extract Japanese text from photos
- Analysis history for authenticated users
- Email/password auth via Better Auth

## Getting Started

### Web — Docker (recommended)

```bash
cp .env.local.example .env.local   # add OPENROUTER_API_KEY
docker compose up                   # starts Next.js + MongoDB replica set
```

### Application monitoring — SigNoz

The web server exports OpenTelemetry traces and structured logs to an existing
SigNoz instance. Web and mobile JavaScript error reports are forwarded through
the API. Set `OTEL_EXPORTER_OTLP_ENDPOINT` and the instance's authentication
headers on the server to enable export. See [monitoring setup](docs/monitoring.md)
for coverage, privacy, alert configuration, retention, and verification.

### Web — without Docker

```bash
npm install
cp .env.local.example .env.local   # add OPENROUTER_API_KEY + MONGODB_URI (replica set required)
npm run dev
```

### Mobile

The web backend must be running first. Then:

```bash
cd mobile && npm install && npx expo start
```

Android emulator uses `10.0.2.2:3000` (pre-configured). For physical devices, update `mobile/constants/api.ts` with your machine's IP.

## Environment Variables

Copy `.env.local.example` — set `MONGODB_URI` and `OPENROUTER_API_KEY`:

| Variable | Notes |
|----------|-------|
| `MONGODB_URI` | Auto-set in Docker; must be a replica set |
| `BETTER_AUTH_URL` | Defaults to `http://localhost:3000` |
| `RATE_LIMIT_IP_HEADER` | Trusted proxy client-IP header; defaults to `x-forwarded-for` |
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai/keys) |
| `DEV_ADMIN_EMAIL` | Dev-only; default `admin@localhost.dev` |
| `DEV_ADMIN_PASSWORD` | Dev-only; default `dev-admin-password` |

Production traffic must reach the app through a trusted reverse proxy that
overwrites `RATE_LIMIT_IP_HEADER`; do not forward a client-supplied value. API
and Better Auth rate-limit counters are stored in MongoDB so they are shared by
all app instances and survive deployments.

Account preferences are managed through the settings screens and `/api/settings`.

### Developer admin account

In development (`NODE_ENV=development`), the app seeds a default admin on startup if it does not already exist:

- **Email:** `admin@localhost.dev`
- **Password:** `dev-admin-password`

Override with `DEV_ADMIN_EMAIL` / `DEV_ADMIN_PASSWORD` / `DEV_ADMIN_NAME`. This account is never created in production.

## Development

```bash
# Web
npm run lint       # Biome
npm run format     # Biome auto-format
npm run build
npm start

# Mobile
cd mobile && npm run lint

# Docker
docker compose up --build     # rebuild after Dockerfile changes
docker compose down -v        # stop + remove data volume
```

## License

ALL RIGHTS RESERVED

## Acknowledgments
- Authentication by [Better Auth](https://www.better-auth.com/)
- Built with [Next.js](https://nextjs.org/), [Expo](https://expo.dev/), and [LangChain](https://js.langchain.com/)
