<img width="1622" height="959" alt="localhost_3000_" src="https://github.com/user-attachments/assets/c158d1ce-ee94-41f4-a4e3-ecb54d22c538" />

AI-powered Japanese sentence breakdown and visualization. Available as a **Next.js web app** and a **React Native (Expo) mobile app**.

## Features

- Sentence analysis via 7 AI providers (Anthropic, OpenAI, Google, xAI, OpenRouter, Cerebras, Fireworks)
- Interactive dependency visualization (React Flow on web, SVG on mobile)
- Image upload — extract Japanese text from photos
- Analysis history for authenticated users
- Japanese conversation practice with AI scoring (WIP)
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

## API

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/analyze` | Analyze a Japanese sentence |
| `POST` | `/api/analyze-image` | Extract + analyze text from an image |
| `GET/PUT` | `/api/settings` | User provider/model settings |
| `GET` | `/api/history` | Paginated analysis history (auth required) |
| `GET/POST` | `/api/conversations` | List or create conversations |
| `GET/DELETE` | `/api/conversations/[id]` | Get or delete a conversation |
| `POST` | `/api/conversations/[id]/messages` | Send a conversation message |
| `*` | `/api/auth/*` | Better Auth (sign-in, sign-up, session, etc.) |

`POST /api/analyze` — request body: `{ "sentence": "私は花を見ました。" }`. Provider and model are read from the user's server-side settings.

## Tech Stack

| | Web | Mobile |
|-|-----|--------|
| Framework | Next.js 16, React 19 | Expo SDK 54, RN 0.81 |
| Styling | Tailwind CSS v4 | NativeWind 4 (Tailwind v3) |
| State / Data | Zustand + TanStack Query | Zustand + MMKV + TanStack Query |
| Visualization | React Flow | react-native-svg |
| Auth | Better Auth (email/password) | Better Auth (Expo plugin) |
| Database | MongoDB 7 | — |
| AI | LangChain (7 providers) | — |
| Linter | Biome 2.2 | ESLint 9 |

Shared theme: `common/tailwind.config.js`. Shared types/providers: `common/`.

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
