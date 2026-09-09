# AGENTS.md

Kaitai is an invite-only beta for AI-powered Japanese sentence analysis. The repo is a Next.js 16 web app (the product and the API) plus a separate Expo/React Native app in `mobile/` that talks to those same routes. Shared types and fetch helpers live in `common/`. Auth is Better Auth (email/password) on MongoDB; signup is gated by admin-issued invite codes, and `src/proxy.ts` sends signed-out web visitors to `/beta`. Sentence analysis and image text extraction run on the server through LangChain. History documents include provider and model metadata for debugging.

This file is a map of the tree, not a design doc. Keep entries focused on broad file responsibilities; omit individual settings, UI interactions, and feature-level implementation details. When you add, remove, rename, or repurpose a path, update the matching line here in the same change. Stale entries are worse than missing ones. Also keep the description above up-to-date as the project evolves. This does not represent every file in the project, just the important ones.

When testing, run the web app through the dockerfile with docker compose.

## Layout

```
.
├── common/                         Shared types, API clients, image/sentence limits (imported as @common/*)
├── src/                            Next.js web app + API (imported as @/*)
├── mobile/                         Expo app; own package.json, talks to the web API
├── public/                         Static assets served by Next
├── Dockerfile                      Multi-stage: deps / dev / builder / standalone prod
├── docker-compose.yml              Local web + Mongo 7 replica set (not for production)
├── package.json                    Web scripts: next (turbopack), biome lint/format
├── next.config.ts                  standalone output
├── tsconfig.json                   @/* → src/*, @common/* → common/*; excludes mobile
├── biome.json                      Lint/format for the web tree
├── components.json                 shadcn/ui config
├── .env.local.example              OpenRouter key + optional DEV_ADMIN_* overrides
├── .github/workflows/              Claude Code GitHub Actions
└── README.md                       Project overview, setup instructions
```

## `common/`

| File | Role |
| --- | --- |
| `types.ts` | `SentenceAnalysis`, `WordNode`, `UserSettings`, history/invite shapes |
| `api.ts` | `analyzeSentence`, `analyzeImage`, `createInviteCode`; `MAX_SENTENCE_LENGTH` |
| `image.ts` | 20MB cap and allowed MIME types for image upload |
| `tailwind.config.js` | Shared light/dark color tokens (web + NativeWind) |
| `assets/branding/logo.svg` | Wordmark used on web |

## `src/` — web + API

### App Router

| Path | Role |
| --- | --- |
| `app/layout.tsx` | Root layout: fonts, theme, Query + settings providers |
| `app/error.tsx` | Branded page error boundary with retry + home recovery |
| `app/global-error.tsx` | Standalone root-layout error boundary; owns document + styles, reads saved/system theme without providers |
| `app/not-found.tsx` | Branded 404 with home recovery |
| `app/page.tsx` | Home: input, image upload, hero |
| `app/beta/page.tsx` | Prelaunch landing for signed-out users |
| `app/sign-up/page.tsx` | Invite-code signup |
| `app/analyze/[sentence]/page.tsx` | Analysis page (sentence in the URL) |
| `app/analyze/[sentence]/layout.tsx` | Persistent analysis shell + header, outside the route error boundary |
| `app/analyze/[sentence]/error.tsx` | Analysis error recovery without unmounting the shell |
| `app/analyze/[sentence]/AnalysisContent.tsx` | Client analysis fetch + visualization |
| `app/globals.css` | Tailwind v4 + theme tokens |

### API routes

All analysis/history/settings routes require a session (`withAuth`). Invite creation requires `{ invite: ["create"] }`. `/api` is excluded from the proxy matcher so the mobile app is never HTML-redirected.

| Path | Role |
| --- | --- |
| `app/api/health/route.ts` | Public process status and Mongo connectivity probe |
| `app/api/analyze/route.ts` | POST sentence → LLM analysis; cache + history write |
| `app/api/analyze-image/route.ts` | POST image → OCR, then same analysis pipeline |
| `app/api/history/route.ts` | GET paginated history for the signed-in user; excludes diagnostic metadata |
| `app/api/settings/route.ts` | GET/PUT account preferences |
| `app/api/admin/invite-codes/route.ts` | POST a 24h invite code (admin) |
| `app/api/auth/[...all]/route.ts` | Better Auth catch-all |

### `src/lib/`

| File | Role |
| --- | --- |
| `auth.ts` | Server Better Auth: Mongo adapter, Expo plugin, admin roles, invite hooks |
| `auth-client.ts` | Browser Better Auth client |
| `auth-permissions.ts` | Access control: `adminPanel`, `invite` |
| `api-auth.ts` | Route-configured auth, permission, and rate-limit wrappers |
| `db.ts` | Mongo client (dev: reused on `globalThis`) |
| `rate-limit.ts` | Atomic Mongo per-user/per-IP application route limits; trusted proxy IP extraction |
| `settings.ts` | Mongo account preference helpers + authenticated settings resolver |
| `history.ts` | `history` collection; upsert on `{ userId, sentence }`; stores provider/model metadata for debugging |
| `invites.ts` | `inviteCodes` collection: create, claim, TTL |
| `cors.ts` | JSON + preflight helpers (`*` in dev, origin header omitted in prod) |
| `validation.ts` | `sanitizeForLLM` |
| `dev-seed.ts` | Seeds `admin@localhost.dev` in development only |
| `user-utils.ts` | `SessionUser` type |
| `utils.ts` | `cn()` (clsx + tailwind-merge), shared `NextJSError` type for web error boundaries |
| `analysis/analyze.ts` | Prompt + structured-output call |
| `analysis/client.ts` | Server-side AI client configuration for text and images |
| `analysis/schema.ts` | Zod schema for structured analysis |
| `analysis/cache.ts` | In-process 1h response cache |
| `analysis/index.ts` | Barrel |

### Components, state, infra

| Path | Role |
| --- | --- |
| `components/Header.tsx` | Top bar |
| `components/ErrorFallback.tsx` | Provider-independent branded error/404 message + recovery actions |
| `components/HomeContent.tsx` | Home interactive area |
| `components/SentenceInput.tsx` | Sentence field + submit |
| `components/SentenceVisualization.tsx` | React Flow dependency graph |
| `components/WordCell.tsx` | Word cell for the sentence graph |
| `components/ImageUploadModal.tsx` | Photo → `/api/analyze-image` |
| `components/HistoryModal.tsx` | Paginated history |
| `components/SettingsModal.tsx` | Settings shell: account preferences + admin invites |
| `components/settings/GeneralSettingsPage.tsx` | Account preferences |
| `components/settings/AdminSettingsPage.tsx` | Invite generation (admin) |
| `components/SignInDialog.tsx` | Sign-in |
| `components/UserMenu.tsx` | Account menu |
| `components/ParticleModal.tsx` | Particle explanation |
| `components/HomeHeroBackground.tsx` | Home background |
| `components/DiagonalMarquee.tsx` | Decorative marquee |
| `components/ui/` | shadcn primitives |
| `stores/settings-store.ts` | Zustand + localStorage account preferences |
| `providers/settings-store-provider.tsx` | Hydrates store; syncs account preferences from server |
| `hooks/use-settings-query.ts` | GET/PUT `/api/settings` query + mutation |
| `providers/query-client-provider.tsx` | TanStack Query |
| `hooks/use-drag-drop.ts` | Image drag-and-drop |
| `proxy.ts` | Prelaunch gate: signed-out → `/beta` (cookie presence only; not auth) |
| `instrumentation.ts` | Runs `seedDevAdmin()` in Node dev |

## `mobile/`

Separate Expo 56 app (file routing). Dev API host is inferred from Expo `hostUri`; Android emulator falls back to `10.0.2.2:3000`. Production URL in `constants/api.ts` is still a placeholder.

| Path | Role |
| --- | --- |
| `app/_layout.tsx` | Root stack, Geist fonts, theme vars, Query, settings preload |
| `app/(tabs)/index.tsx` | Analyze tab |
| `app/(tabs)/more.tsx` | More / overflow tab |
| `app/results.tsx` | Analysis results |
| `app/history.tsx` | History |
| `app/settings.tsx` | Account preferences |
| `app/sign-in.tsx` / `sign-up.tsx` | Auth |
| `components/themed-text.tsx` | Geist `ThemedText` / `ThemedTextInput` |
| `components/dependency-map.tsx` | SVG dependency graph |
| `components/bottom-sheet.tsx` / `bottom-sheet-picker.tsx` | Sheets |
| `constants/api.ts` | `API_BASE_URL` + endpoint map |
| `lib/fonts.ts` | Load Geist; NativeWind `font-geist-reg` maps to it |
| `lib/auth-client.ts` | Better Auth Expo client (SecureStore) |
| `lib/auth-fetch.ts` | Authenticated fetch |
| `lib/query-client.ts` | Shared Query client |
| `hooks/use-settings-sync.ts` | Server account preferences → Zustand; query + mutation |
| `stores/settings-store.ts` | Persisted account preferences |
| `android/` / `ios/` | Native projects from `expo prebuild` |

## Conventions

- Web lint/format: `npm run lint` / `npm run format` (Biome). Mobile: `cd mobile && npm run lint`.
- Provider/model metadata is stored in history documents for debugging and excluded from client responses.
- Image text extraction and sentence analysis share the server AI client configuration.
- Mongo must be a replica set (Better Auth transactions). Docker Compose does this; a lone `mongod` will fail.
- `docker-compose.yml` is local-only. Do not treat it as a deploy config.
- Dev admin is seeded only when `NODE_ENV=development`. Never rely on those credentials in production.
- Signup invite hooks cover `/sign-up/email` only. Any new public signup path must be gated the same way.
- `src/proxy.ts` is a routing gate. Real auth is `withAuth` / `withPermission` against Mongo.
- Production ingress must overwrite `RATE_LIMIT_IP_HEADER` (default `x-forwarded-for`); API and Better Auth limits use Mongo-backed counters.
