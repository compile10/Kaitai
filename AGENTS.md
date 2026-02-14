# AGENTS.md — Kaitai (解体)

## What this project is

Kaitai (解体) is an AI-powered Japanese sentence analyzer that breaks down sentences into their grammatical components and visualizes the relationships between them. It ships as two clients — a Next.js web app and a React Native (Expo) mobile app — both sharing a common TypeScript layer and talking to a single Next.js API route that fans out to multiple LLM providers via LangChain.

## Repository layout

```
/
├── common/                  # Shared TypeScript code (types, API client, provider config)
│   ├── api.ts               # analyzeSentence() — shared fetch wrapper used by both clients
│   ├── providers.ts         # PROVIDER_MAP and PROVIDERS array (all 7 AI provider configs)
│   └── types.ts             # WordNode, SentenceAnalysis, GrammarPoint, Provider, ModelInfo, ProviderConfig
│
├── src/                     # Next.js 15 web app (App Router)
│   ├── app/
│   │   ├── api/analyze/route.ts   # POST /api/analyze — the only API endpoint
│   │   ├── layout.tsx             # Root layout (fonts, SettingsStoreProvider)
│   │   └── page.tsx               # Main page (server component: header + footer shell)
│   ├── components/
│   │   ├── HomeContent.tsx         # Client component with interactive page logic
│   │   ├── ParticleModal.tsx       # Particle explanation popup
│   │   ├── SentenceInput.tsx       # Text input + example sentence buttons
│   │   ├── SentenceVisualization.tsx  # React Flow graph + word details (SSR-ready node dims)
│   │   └── SettingsModal.tsx       # Provider/model selection modal
│   ├── providers/
│   │   └── settings-store-provider.tsx  # Zustand context provider + useSettingsStore hook
│   └── stores/
│       └── settings-store.ts       # Zustand vanilla store factory (createSettingsStore)
│
├── mobile/                  # React Native app (Expo SDK 54, Expo Router)
│   ├── app/                 # File-based routing
│   │   ├── _layout.tsx      # Stack navigator + theme
│   │   ├── index.tsx        # Home screen (sentence input)
│   │   ├── results.tsx      # Analysis results display
│   │   └── settings.tsx     # Provider/model settings
│   ├── components/          # ThemedText, ThemedView, DependencyMap, BottomSheetPicker
│   ├── constants/           # Platform-aware API URLs, colors, theme
│   ├── hooks/               # useColorScheme, useThemeColor
│   └── stores/
│       └── settings-store.ts  # Zustand + Expo SecureStore persistence
│
├── biome.json               # Biome 2.2 config (linter + formatter for web)
├── next.config.ts           # Next.js config (minimal)
├── postcss.config.mjs       # Tailwind v4 via @tailwindcss/postcss
├── tsconfig.json            # Root TS config (paths: @/* → ./src/*, @common/* → ./common/*)
├── .env.local.example       # Template for required API keys
└── package.json             # Root package.json (web app deps + scripts)
```

## Tech stack at a glance

| Layer | Web | Mobile | Shared |
|-------|-----|--------|--------|
| Framework | Next.js 15 (App Router, Turbopack) | Expo SDK 54, React Native 0.81 | — |
| Language | TypeScript 5 | TypeScript 5.9 | TypeScript |
| UI | React 19, Tailwind CSS v4 | React Native, NativeWind 4 (Tailwind v3) | — |
| State | Zustand + localStorage | Zustand + Expo SecureStore | — |
| Routing | Next.js App Router | Expo Router (file-based) | — |
| Visualization | @xyflow/react (React Flow) | SVG dependency map (react-native-svg) | — |
| AI | LangChain (Anthropic, OpenAI, Google, xAI, OpenRouter, Cerebras, Fireworks) | — | Provider config |
| Linter | Biome 2.2 | ESLint 9 (eslint-config-expo) | — |

## Setting up the dev environment

### Prerequisites

- Node.js (LTS)
- npm (lockfiles are `package-lock.json`, **not** yarn or pnpm)
- At least one AI provider API key (see `.env.local.example`)

### Web app (root)

```bash
npm install                      # Install dependencies
cp .env.local.example .env.local # Create env file, then fill in at least one API key
npm run dev                      # Starts Next.js dev server with Turbopack on http://localhost:3000
```

### Mobile app

```bash
cd mobile
npm install                      # Separate node_modules for mobile
npx expo start                   # Starts Expo dev server
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

## Environment variables

All API keys live in `.env.local` (git-ignored). At least one key is required for the app to function. The API route reads them via `process.env`:

| Variable | Provider | Sign-up URL |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic Claude | https://console.anthropic.com/ |
| `OPENAI_API_KEY` | OpenAI | https://platform.openai.com/api-keys |
| `GOOGLE_API_KEY` | Google Gemini | https://makersuite.google.com/app/apikey |
| `XAI_API_KEY` | xAI Grok | https://console.x.ai/ |
| `OPENROUTER_API_KEY` | OpenRouter | https://openrouter.ai/keys |
| `CEREBRAS_API_KEY` | Cerebras | https://cloud.cerebras.ai/ |
| `FIREWORKS_API_KEY` | Fireworks AI | https://fireworks.ai/ |

**Never commit `.env.local` or any file containing real API keys.**

## Architecture details

### The API endpoint (`src/app/api/analyze/route.ts`)

This is the **only** backend endpoint. Both clients POST to `/api/analyze` with:

```json
{ "sentence": "日本語の文", "provider": "anthropic", "model": "claude-sonnet-4-5-20250929" }
```

Key implementation details:
- **Provider factory**: `createChatModel(provider, model)` instantiates the right LangChain chat model class.
- **Structured output**: Uses LangChain's `withStructuredOutput()` with a Zod schema matching `SentenceAnalysis`.
- **Caching**: In-memory `Map` with 1-hour TTL, auto-evicts oldest entries at 100 items. Cache key is `${provider}:${model}:${sentence}`.
- **Sanitization**: `sanitize-html` strips dangerous HTML from the LLM's `explanation` and particle `description` fields.
- **CORS**: Enabled with `Access-Control-Allow-Origin: *` (suitable for dev; tighten for production).

### Shared code (`common/`)

Both `tsconfig.json` files define a `@common/*` path alias:
- Web: `@common/*` → `./common/*`
- Mobile: `@common/*` → `../common/*`

The mobile Metro bundler is configured to watch the `common/` directory (`metro.config.js` → `watchFolders`).

When modifying `common/`, changes affect **both** clients. Test both after editing shared code.

### State management

- **Web**: Zustand vanilla store factory (`src/stores/settings-store.ts`) + context provider (`src/providers/settings-store-provider.tsx`). The store persists provider/model selection to `localStorage` under the key `kaitai-settings` via Zustand's `persist` middleware with `skipHydration: true`. The `SettingsStoreProvider` (rendered in the root layout) creates the store instance, manages rehydration via `useEffect`, and exposes the store through React Context. Components access state via `useSettingsStore(selector)` and hydration status via `useIsHydrated()`. This follows the [Zustand recommended Next.js pattern](https://zustand.docs.pmnd.rs/guides/nextjs) for proper SSR support and per-request store isolation.
- **Mobile**: Zustand store (`mobile/stores/settings-store.ts`) persists to Expo SecureStore (encrypted). Hydration is tracked via `isHydrated`. Supports a `useCustomModel` toggle for custom model input. Always check hydration before rendering settings-dependent UI.

### Styling conventions

- **Web**: Tailwind CSS **v4** (utility-first, configured via `@tailwindcss/postcss`). Global styles in `src/app/globals.css`.
- **Mobile**: NativeWind **4.2** wrapping Tailwind CSS **v3** (note the version difference from web). Global styles in `mobile/global.css`. Custom theme colors are defined in `mobile/tailwind.config.js`.
- Both use `className` props. Mobile components use NativeWind's `cssInterop`.

### No database

There is no database. The API cache is in-memory (lost on restart). Client preferences are stored locally (localStorage on web, SecureStore on mobile).

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
4. Add the model instantiation case in `createChatModel()` in `src/app/api/analyze/route.ts`
5. Add the env variable name to `.env.local.example` and your `.env.local`
6. Both clients pick up the new provider automatically via shared `common/providers.ts`

### Adding a new model to an existing provider

1. Add the model entry to the provider's `models` array in `common/providers.ts`
2. That's it — both clients and the API route read from `PROVIDER_MAP`

### Modifying the analysis output schema

1. Update `SentenceAnalysis` and/or `WordNode` in `common/types.ts`
2. Update the Zod schema in `src/app/api/analyze/route.ts` (the `sentenceAnalysisSchema` variable)
3. Update the LLM prompt in the same file if the new fields need specific instructions
4. Update visualization components in both `src/components/SentenceVisualization.tsx` (web) and `mobile/app/results.tsx` (mobile)

### Changing platform-specific API URLs

Edit `mobile/constants/api.ts`. The `buildApiUrl()` function handles platform detection. For production, update the `PROD_URL` constant.

## Pitfalls and gotchas

- **Tailwind version mismatch**: Web uses Tailwind v4, mobile uses Tailwind v3. Class syntax and configuration differ between them. Don't copy-paste styles between projects without checking compatibility.
- **Two package.json files**: Root is for the web app, `mobile/package.json` is for the mobile app. They are **not** workspaces — each has its own `node_modules` and lockfile.
- **Metro watchFolders**: The mobile app's Metro config watches `common/`. If you rename or move `common/`, update `mobile/metro.config.js`.
- **Cache is ephemeral**: The API's in-memory cache is lost on server restart. Don't rely on it for correctness.
- **CORS is wide open**: `Access-Control-Allow-Origin: *` is fine for dev but must be restricted for production.
- **SecureStore size limits**: Expo SecureStore has a 2KB value limit per key on some platforms. The settings store is small, but be cautious adding large values.
- **HTML from LLMs**: The API sanitizes HTML in `explanation` and particle descriptions. If you add new HTML-containing fields, add them to the sanitization step.
- **SSR architecture**: `page.tsx` is a server component that renders the static shell (header, footer). Interactive logic lives in client components (`HomeContent.tsx`, `SentenceVisualization.tsx`, `SettingsModal.tsx`, etc.). React Flow v12 supports SSR — nodes have explicit `width`/`height` dimensions for server-side rendering without client measurement.
- **Grammar points from LLMs**: The API returns `grammarPoints` (title + explanation) as part of the analysis. Grammar point explanations are sanitized to plain text.
