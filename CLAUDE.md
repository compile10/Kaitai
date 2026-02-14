# CLAUDE.md — Kaitai (解体)

## What this project is

Kaitai (解体) is an AI-powered Japanese sentence analyzer that breaks down sentences into their grammatical components and visualizes the relationships between them. It ships as two clients — a Next.js web app and a React Native (Expo) mobile app — both sharing a common TypeScript layer and talking to a single Next.js API route that fans out to multiple LLM providers via LangChain.

## Repository layout

```
/
├── common/                  # Shared TypeScript code (types, API client, provider config, theme)
│   ├── api.ts               # analyzeSentence() — shared fetch wrapper used by both clients
│   ├── providers.ts         # PROVIDER_MAP and PROVIDERS array (all 7 AI provider configs)
│   ├── tailwind.config.js   # Shared Tailwind theme config (single source of truth for colors)
│   └── types.ts             # WordNode, SentenceAnalysis, GrammarPoint, Provider, ModelInfo, ProviderConfig
│
├── src/                     # Next.js web app (App Router)
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze/route.ts       # POST /api/analyze — sentence analysis endpoint
│   │   │   └── auth/[...all]/route.ts # Better Auth catch-all route (/api/auth/*)
│   │   ├── sign-up/page.tsx           # Sign-up page
│   │   ├── layout.tsx                 # Root layout (fonts, SettingsStoreProvider)
│   │   └── page.tsx                   # Main page (server component: header + footer shell, auth-aware)
│   ├── components/
│   │   ├── ui/                        # Reusable UI primitives (shadcn-style)
│   │   │   ├── button.tsx             # Button component
│   │   │   ├── card.tsx               # Card, CardHeader, CardTitle, CardContent, etc.
│   │   │   ├── dialog.tsx             # Dialog (Radix UI)
│   │   │   ├── field.tsx              # Form field components (Field, FieldLabel, FieldError, etc.)
│   │   │   ├── input.tsx              # Input component
│   │   │   ├── label.tsx              # Label component
│   │   │   └── separator.tsx          # Separator component
│   │   ├── HomeContent.tsx            # Client component with interactive page logic
│   │   ├── ImageUploadModal.tsx       # Image upload modal for text extraction
│   │   ├── ParticleModal.tsx          # Particle explanation popup
│   │   ├── SentenceInput.tsx          # Text input + example sentence buttons + image upload
│   │   ├── SentenceVisualization.tsx  # React Flow graph + word details (SSR-ready node dims)
│   │   ├── SettingsModal.tsx          # Provider/model selection modal
│   │   ├── SignInDialog.tsx           # Sign-in modal dialog (Radix UI Dialog)
│   │   └── UserMenu.tsx              # Authenticated user display + sign-out button
│   ├── lib/
│   │   ├── analysis/                  # Analysis logic (refactored from route.ts)
│   │   │   ├── analyze.ts            # Core analysis function (LLM call + sanitization)
│   │   │   ├── cache.ts              # In-memory cache (1hr TTL, 100 max entries)
│   │   │   ├── index.ts              # Barrel exports
│   │   │   ├── providers.ts          # createChatModel() provider factory
│   │   │   └── schema.ts             # Zod schema for structured LLM output
│   │   ├── auth.ts                    # Better Auth server instance (MongoDB adapter, Expo plugin)
│   │   ├── auth-client.ts            # Better Auth client for web (React hooks)
│   │   ├── db.ts                      # MongoDB client singleton
│   │   └── utils.ts                   # Utility functions (cn for className merging)
│   ├── providers/
│   │   └── settings-store-provider.tsx  # Zustand context provider + useSettingsStore hook
│   └── stores/
│       └── settings-store.ts          # Zustand vanilla store factory (createSettingsStore)
│
├── mobile/                  # React Native app (Expo SDK 54, Expo Router)
│   ├── app/                 # File-based routing
│   │   ├── (tabs)/          # Bottom tab navigator group
│   │   │   ├── _layout.tsx  # Tab bar config (Home + More tabs)
│   │   │   ├── index.tsx    # Home screen (sentence input, image picker)
│   │   │   └── more.tsx     # Profile/more screen (auth-aware)
│   │   ├── _layout.tsx      # Root stack navigator + theme + SessionPreloader
│   │   ├── results.tsx      # Analysis results display
│   │   ├── settings.tsx     # Provider/model settings
│   │   ├── sign-in.tsx      # Sign-in screen
│   │   └── sign-up.tsx      # Sign-up screen
│   ├── components/          # ThemedText, ThemedView, DependencyMap, BottomSheetPicker
│   ├── constants/           # Platform-aware API URLs
│   ├── hooks/
│   │   ├── use-color-scheme.ts   # Color scheme detection
│   │   └── use-raw-css-theme.ts  # Raw hex color values from shared theme config
│   ├── lib/
│   │   └── auth-client.ts  # Better Auth client for mobile (Expo plugin, SecureStore)
│   └── stores/
│       └── settings-store.ts  # Zustand + Expo SecureStore persistence
│
├── .dockerignore            # Docker build context exclusions
├── .npmrc                   # npm config (legacy-peer-deps=true)
├── biome.json               # Biome 2.2 config (linter + formatter for web)
├── docker-compose.yml       # Local dev: Next.js + MongoDB replica set
├── Dockerfile               # Multi-stage build (dev + production)
├── next.config.ts           # Next.js config (standalone output)
├── postcss.config.mjs       # Tailwind v4 via @tailwindcss/postcss
├── tsconfig.json            # Root TS config (paths: @/* → ./src/*, @common/* → ./common/*)
├── .env.local.example       # Template for required API keys
└── package.json             # Root package.json (web app deps + scripts)
```

## Tech stack at a glance

| Layer | Web | Mobile | Shared |
|-------|-----|--------|--------|
| Framework | Next.js 16 (App Router, Turbopack) | Expo SDK 54, React Native 0.81 | — |
| Language | TypeScript 5 | TypeScript 5.9 | TypeScript |
| UI | React 19, Tailwind CSS v4, shadcn components | React Native, NativeWind 4 (Tailwind v3) | — |
| State | Zustand + localStorage | Zustand + Expo SecureStore | — |
| Routing | Next.js App Router | Expo Router (file-based, bottom tabs) | — |
| Visualization | @xyflow/react (React Flow) | SVG dependency map (react-native-svg) | — |
| AI | LangChain (Anthropic, OpenAI, Google, xAI, OpenRouter, Cerebras, Fireworks) | — | Provider config |
| Auth | Better Auth (email/password) | Better Auth (Expo plugin) | — |
| Database | MongoDB 7 (via mongodb driver) | — | — |
| UI Components | Radix UI, Lucide icons, CVA | — | — |
| Linter | Biome 2.2 | ESLint 9 (eslint-config-expo) | — |

## Setting up the dev environment

### Prerequisites

- Node.js (LTS)
- npm (lockfiles are `package-lock.json`, **not** yarn or pnpm)
- At least one AI provider API key (see `.env.local.example`)
- MongoDB (via Docker or local install) — required for authentication

### Web app — with Docker (recommended)

```bash
cp .env.local.example .env.local       # Create env file, then fill in at least one API key
docker compose up                       # Starts Next.js dev server + MongoDB replica set
```

The Docker setup handles MongoDB initialization (single-node replica set) and connects the web app automatically. Hot-reload is enabled via volume mounts.

### Web app — without Docker

```bash
npm install                             # Install dependencies
cp .env.local.example .env.local        # Create env file, then fill in API keys + MONGODB_URI
npm run dev                             # Starts Next.js dev server with Turbopack on http://localhost:3000
```

You must provide your own MongoDB instance and set `MONGODB_URI` in `.env.local`. MongoDB must be configured as a replica set (required by Better Auth for transactions).

### Mobile app

```bash
cd mobile
npm install                             # Separate node_modules for mobile
npx expo start                          # Starts Expo dev server
```

The mobile app connects to the Next.js API server. The web dev server **must be running** for the mobile app to work. Platform-aware API URLs are in `mobile/constants/api.ts`:
- Android emulator: `http://10.0.2.2:3000`
- iOS simulator / web: `http://localhost:3000`

## Scripts reference

### Root (web app)

| Command | What it does |
|---------|-------------|
| `npm run dev` | Next.js dev server with Turbopack |
| `npm run build` | Production build (Turbopack) |
| `npm run start` | Serve production build |
| `npm run lint` | Run Biome linter (`biome check`) |
| `npm run format` | Auto-format with Biome (`biome format --write`) |

### Mobile (`mobile/`)

| Command | What it does |
|---------|-------------|
| `npm start` | Expo dev server |
| `npm run android` | Build and run on Android |
| `npm run ios` | Build and run on iOS |
| `npm run web` | Start Expo for web |
| `npm run lint` | Run ESLint via Expo (`expo lint`) |

### Docker

| Command | What it does |
|---------|-------------|
| `docker compose up` | Start web + MongoDB (dev mode, hot-reload) |
| `docker compose up --build` | Rebuild and start (after Dockerfile changes) |
| `docker compose down` | Stop services |
| `docker compose down -v` | Stop services and remove MongoDB data volume |

## Environment variables

All environment variables live in `.env.local` (git-ignored). The API route and auth system read them via `process.env`:

| Variable | Required | Purpose | Notes |
|----------|----------|---------|-------|
| `MONGODB_URI` | Yes | MongoDB connection string | Auto-set in Docker; must be a replica set |
| `BETTER_AUTH_URL` | No | Base URL for Better Auth | Defaults to `http://localhost:3000`; set in Docker |
| `ANTHROPIC_API_KEY` | At least one AI key | Anthropic Claude | https://console.anthropic.com/ |
| `OPENAI_API_KEY` | At least one AI key | OpenAI | https://platform.openai.com/api-keys |
| `GOOGLE_API_KEY` | At least one AI key | Google Gemini | https://makersuite.google.com/app/apikey |
| `XAI_API_KEY` | At least one AI key | xAI Grok | https://console.x.ai/ |
| `OPENROUTER_API_KEY` | At least one AI key | OpenRouter | https://openrouter.ai/keys |
| `CEREBRAS_API_KEY` | At least one AI key | Cerebras | https://cloud.cerebras.ai/ |
| `FIREWORKS_API_KEY` | At least one AI key | Fireworks AI | https://fireworks.ai/ |

**Never commit `.env.local` or any file containing real API keys.**

## Architecture details

### API endpoints

There are two API route groups:

1. **`/api/analyze`** (`src/app/api/analyze/route.ts`) — Sentence analysis. Both clients POST with:

```json
{ "sentence": "日本語の文", "provider": "anthropic", "model": "claude-sonnet-4-5-20250929" }
```

The analysis logic has been refactored into `src/lib/analysis/`:
- **`providers.ts`**: `createChatModel(provider, model)` — provider factory that instantiates the right LangChain chat model class.
- **`schema.ts`**: Zod schema for structured LLM output matching `SentenceAnalysis`.
- **`analyze.ts`**: Core analysis function — calls LLM with structured output, sanitizes HTML in response.
- **`cache.ts`**: In-memory `Map` with 1-hour TTL, auto-evicts oldest entries at 100 items.
- **`index.ts`**: Barrel exports.

2. **`/api/auth/[...all]`** (`src/app/api/auth/[...all]/route.ts`) — Better Auth catch-all handler. Handles all authentication routes (sign-in, sign-up, sign-out, session, etc.).

### Authentication (`Better Auth`)

Authentication is handled by [Better Auth](https://www.better-auth.com/) with email/password strategy:

- **Server** (`src/lib/auth.ts`): Better Auth instance with MongoDB adapter, session cookie caching (5 min TTL), and plugins for Expo mobile support and Next.js cookies.
- **Web client** (`src/lib/auth-client.ts`): `authClient` from `better-auth/react` providing React hooks (`useSession`, `signIn.email`, `signUp.email`, `signOut`).
- **Mobile client** (`mobile/lib/auth-client.ts`): `authClient` from `@better-auth/expo/client` with SecureStore persistence and `kaitai://` custom scheme for deep linking.
- **Trusted origins**: `kaitai://` (mobile deep linking), `exp://` (Expo development).

Web auth UI:
- `page.tsx` checks session server-side and renders `UserMenu` (authenticated) or `SignInDialog` + sign-up link (unauthenticated).
- `SignInDialog.tsx`: Modal dialog for sign-in (email/password).
- `UserMenu.tsx`: Displays user name/email with sign-out button.
- `sign-up/page.tsx`: Full-page sign-up form.

Mobile auth UI:
- `more.tsx`: Profile tab showing user info (authenticated) or sign-in/sign-up links (unauthenticated).
- `sign-in.tsx` and `sign-up.tsx`: Dedicated auth screens with keyboard-aware forms.
- `SessionPreloader` component in `_layout.tsx` calls `useSession()` on app start to preload auth state.

### Database (`MongoDB`)

MongoDB is the project database, used by Better Auth for storing users and sessions:

- **Client** (`src/lib/db.ts`): Singleton MongoDB client. In development, the client is cached on `globalThis` to prevent multiple connections during hot-reload. In production, a new client is created per instance.
- **Connection**: Requires `MONGODB_URI` environment variable. Must be a replica set (Better Auth uses transactions).
- **Docker**: `docker-compose.yml` provisions a MongoDB 7 single-node replica set (`rs0`) with a persistent `mongo-data` volume. Health check auto-initializes the replica set.
- **No ORM**: The app uses the native `mongodb` driver directly. Better Auth manages its own collections.

### Shared code (`common/`)

Both `tsconfig.json` files define a `@common/*` path alias:
- Web: `@common/*` → `./common/*`
- Mobile: `@common/*` → `../common/*`

The mobile Metro bundler is configured to watch the `common/` directory (`metro.config.js` → `watchFolders`).

The `common/` directory now also contains `tailwind.config.js` — the shared theme configuration used by both web and mobile (see Styling conventions below).

When modifying `common/`, changes affect **both** clients. Test both after editing shared code.

### State management

- **Web**: Zustand vanilla store factory (`src/stores/settings-store.ts`) + context provider (`src/providers/settings-store-provider.tsx`). The store persists provider/model selection to `localStorage` under the key `kaitai-settings` via Zustand's `persist` middleware with `skipHydration: true`. The `SettingsStoreProvider` (rendered in the root layout) creates the store instance, manages rehydration via `useEffect`, and exposes the store through React Context. Components access state via `useSettingsStore(selector)` and hydration status via `useIsHydrated()`. This follows the [Zustand recommended Next.js pattern](https://zustand.docs.pmnd.rs/guides/nextjs) for proper SSR support and per-request store isolation.
- **Mobile**: Zustand store (`mobile/stores/settings-store.ts`) persists to Expo SecureStore (encrypted). Hydration is tracked via `isHydrated`. Supports a `useCustomModel` toggle for custom model input. Always check hydration before rendering settings-dependent UI.

### Styling conventions

- **Shared theme**: `common/tailwind.config.js` is the single source of truth for theme colors (text, background, tint, icon, border, card, error, warning, topic — each with light/dark variants). Both platforms import this config.
- **Web**: Tailwind CSS **v4** (utility-first, configured via `@tailwindcss/postcss`). Global styles in `src/app/globals.css` which imports the shared config via `@config "../../common/tailwind.config.js"`. UI components use `class-variance-authority` (CVA), `clsx`, and `tailwind-merge` via the `cn()` utility in `src/lib/utils.ts`.
- **Mobile**: NativeWind **4.2** wrapping Tailwind CSS **v3** (note the version difference from web). Global styles in `mobile/global.css`. `mobile/tailwind.config.js` uses the shared config as a preset. The `useRawCSSTheme` hook (`mobile/hooks/use-raw-css-theme.ts`) provides raw hex color values from the shared theme for React Native APIs that don't accept Tailwind classes.
- Both use `className` props. Mobile components use NativeWind's `cssInterop`.

### Mobile navigation

The mobile app uses **Expo Router** with a combination of stack and tab navigation:

- **Root**: Stack navigator (`mobile/app/_layout.tsx`) with routes for `(tabs)`, `results`, `settings`, `sign-in`, `sign-up`.
- **Tabs**: Bottom tab navigator (`mobile/app/(tabs)/_layout.tsx`) with two tabs:
  - **Home** (`index.tsx`): Sentence input, image picker, example sentences.
  - **More** (`more.tsx`): Profile/settings hub, auth-aware (shows user info or sign-in/sign-up).
- Tab bar uses Ionicons and colors from the shared Tailwind theme config.

### Docker setup

The project includes Docker configuration for local development:

- **`Dockerfile`**: Multi-stage build with `base` (Node 24 Alpine), `deps` (npm ci), `dev` (hot-reload), `builder` (production build), and `prod` (standalone Next.js) stages.
- **`docker-compose.yml`**: Two services — `web` (Next.js dev server with volume mounts) and `mongo` (MongoDB 7 replica set). The web service depends on mongo being healthy.
- **`next.config.ts`**: Uses `output: "standalone"` for Docker-compatible production builds.
- **`.npmrc`**: Sets `legacy-peer-deps=true` to resolve peer dependency conflicts (zod/better-call).

## Linting and formatting

### Web (root)

The web app uses **Biome 2.2** for both linting and formatting:

```bash
npm run lint      # biome check (lint only)
npm run format    # biome format --write (auto-format)
```

Biome rules (`biome.json`):
- Recommended rules enabled
- Next.js and React domains enabled
- Import organization enabled (`organizeImports: "on"`)
- 2-space indentation
- `noUnknownAtRules` is turned off (Tailwind v4 `@theme` directives)

### Mobile

The mobile app uses **ESLint 9** with `eslint-config-expo`:

```bash
cd mobile
npm run lint      # expo lint
```

### Important

The two sub-projects use **different linters**. Run the correct one for the code you changed:
- Changed files under `src/` or `common/` or root configs → `npm run lint` (Biome)
- Changed files under `mobile/` → `cd mobile && npm run lint` (ESLint)

## Testing

There are **no automated tests** currently. No test runner (Jest, Vitest, etc.) is configured. If you add tests:
- For the web app, Vitest is the recommended choice (pairs well with Next.js and Biome).
- For the mobile app, Jest via `jest-expo` is standard for Expo projects.
- Add a `test` script to the relevant `package.json`.

## Git workflow

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Primary development branch |

Feature branches are created from `main` and merged back via pull requests.

### Conventions

- The project uses **npm** (not yarn or pnpm). Always use `npm install` and commit `package-lock.json`.
- Two separate `node_modules` directories: root and `mobile/`. Install in both if adding shared dependencies.
- Run the appropriate linter before committing (see Linting section above).

## Common tasks

### Adding a new AI provider

1. Add the provider's LangChain package: `npm install @langchain/<provider>`
2. Add the provider ID to the `Provider` type union in `common/types.ts`
3. Add provider config (models, default) to `PROVIDER_MAP` in `common/providers.ts`
4. Add the model instantiation case in `createChatModel()` in `src/lib/analysis/providers.ts`
5. Add the env variable name to `.env.local.example` and your `.env.local`
6. Both clients pick up the new provider automatically via shared `common/providers.ts`

### Adding a new model to an existing provider

1. Add the model entry to the provider's `models` array in `common/providers.ts`
2. That's it — both clients and the API route read from `PROVIDER_MAP`

### Modifying the analysis output schema

1. Update `SentenceAnalysis` and/or `WordNode` in `common/types.ts`
2. Update the Zod schema in `src/lib/analysis/schema.ts`
3. Update the LLM prompt in `src/lib/analysis/analyze.ts` if the new fields need specific instructions
4. Update visualization components in both `src/components/SentenceVisualization.tsx` (web) and `mobile/app/results.tsx` (mobile)

### Modifying theme colors

1. Update the color values in `common/tailwind.config.js` (the single source of truth)
2. Both web and mobile pick up changes automatically — web via `@config` in `globals.css`, mobile via preset in `mobile/tailwind.config.js`
3. For React Native APIs that need raw hex values, use the `useRawCSSTheme` hook

### Changing platform-specific API URLs

Edit `mobile/constants/api.ts`. The `buildApiUrl()` function handles platform detection. For production, update the `PROD_URL` constant.

## Pitfalls and gotchas

- **Tailwind version mismatch**: Web uses Tailwind v4, mobile uses Tailwind v3. Class syntax and configuration differ between them. Don't copy-paste styles between projects without checking compatibility. Both share theme colors via `common/tailwind.config.js`.
- **Two package.json files**: Root is for the web app, `mobile/package.json` is for the mobile app. They are **not** workspaces — each has its own `node_modules` and lockfile.
- **Metro watchFolders**: The mobile app's Metro config watches `common/`. If you rename or move `common/`, update `mobile/metro.config.js`.
- **Cache is ephemeral**: The API's in-memory cache is lost on server restart. Don't rely on it for correctness.
- **CORS is wide open**: `Access-Control-Allow-Origin: *` is fine for dev but must be restricted for production.
- **SecureStore size limits**: Expo SecureStore has a 2KB value limit per key on some platforms. The settings store is small, but be cautious adding large values.
- **HTML from LLMs**: The API sanitizes HTML in `explanation` and particle descriptions. If you add new HTML-containing fields, add them to the sanitization step in `src/lib/analysis/analyze.ts`.
- **SSR architecture**: `page.tsx` is a server component that fetches the session server-side and renders the static shell (header with auth UI, footer). Interactive logic lives in client components (`HomeContent.tsx`, `SentenceVisualization.tsx`, `SettingsModal.tsx`, etc.). React Flow v12 supports SSR — nodes have explicit `width`/`height` dimensions for server-side rendering without client measurement.
- **Grammar points from LLMs**: The API returns `grammarPoints` (title + explanation) as part of the analysis. Grammar point explanations are sanitized to plain text.
- **MongoDB replica set**: Better Auth requires transactions, which need a MongoDB replica set. The Docker setup handles this automatically. If running MongoDB manually, you must configure it as a replica set.
- **legacy-peer-deps**: The `.npmrc` sets `legacy-peer-deps=true` due to peer dependency conflicts between zod and better-call. This is required for `npm install` to succeed.
- **Auth trusted origins**: The Better Auth server config trusts `kaitai://` and `exp://` (in development) as origins. Update `src/lib/auth.ts` if adding new mobile schemes or origins.
