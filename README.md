<img width="1622" height="959" alt="localhost_3000_" src="https://github.com/user-attachments/assets/c158d1ce-ee94-41f4-a4e3-ecb54d22c538" />

AI-powered Japanese sentence breakdown and visualization. Available as a **Next.js web app** and a **React Native (Expo) mobile app**.

## Features

- Sentence analysis via 7 AI providers (Anthropic, OpenAI, Google, xAI, OpenRouter, Cerebras, Fireworks)
- Interactive dependency visualization (React Flow on web, SVG on mobile)
- Image upload — extract Japanese text from photos
- Analysis history for authenticated users
- Server-synced provider/model settings per user
- Email/password auth via Better Auth

## Getting Started

### Web — Docker (recommended)

```bash
cp .env.local.example .env.local   # add at least one AI provider key
docker compose up                   # starts Next.js + MongoDB replica set
```

### Web — without Docker

```bash
npm install
cp .env.local.example .env.local   # add API keys + MONGODB_URI (replica set required)
npm run dev
```

### Mobile

The web backend must be running first. Then:

```bash
cd mobile && npm install && npx expo start
```

Android emulator uses `10.0.2.2:3000` (pre-configured). For physical devices, update `mobile/constants/api.ts` with your machine's IP.

## Environment Variables

Copy `.env.local.example` — set `MONGODB_URI` and at least one AI key:

| Variable | Notes |
|----------|-------|
| `MONGODB_URI` | Auto-set in Docker; must be a replica set |
| `BETTER_AUTH_URL` | Defaults to `http://localhost:3000` |
| `ANTHROPIC_API_KEY` | [console.anthropic.com](https://console.anthropic.com/) |
| `OPENAI_API_KEY` | [platform.openai.com](https://platform.openai.com/api-keys) |
| `GOOGLE_API_KEY` | [makersuite.google.com](https://makersuite.google.com/app/apikey) |
| `XAI_API_KEY` | [console.x.ai](https://console.x.ai/) |
| `OPENROUTER_API_KEY` | [openrouter.ai](https://openrouter.ai/keys) |
| `CEREBRAS_API_KEY` | [cloud.cerebras.ai](https://cloud.cerebras.ai/) |
| `FIREWORKS_API_KEY` | [fireworks.ai](https://fireworks.ai/) |
| `DEV_ADMIN_EMAIL` | Dev-only; default `admin@localhost.dev` |
| `DEV_ADMIN_PASSWORD` | Dev-only; default `dev-admin-password` |

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
