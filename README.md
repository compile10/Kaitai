# Kaitai (解体) — Japanese Sentence Analyzer
<img width="1622" height="959" alt="localhost_3000_" src="https://github.com/user-attachments/assets/c158d1ce-ee94-41f4-a4e3-ecb54d22c538" />


An application that analyzes Japanese sentence structure using AI. This tool visualizes how words and phrases relate to each other, showing grammatical relationships with interactive diagrams. Available as a **Next.js web app** and a **React Native mobile app**.

## Features

- 🎯 AI-powered Japanese sentence analysis with multiple provider support
- 🤖 Support for 7 AI providers: Anthropic Claude, OpenAI, Google Gemini, xAI Grok, OpenRouter, Cerebras, and Fireworks AI
- 📊 Visual representation of sentence structure with arrows showing modification relationships
- 📷 Image upload support — extract Japanese text from photos for analysis
- 🇯🇵 Support for any Japanese sentence
- ⚡ Real-time analysis with structured JSON output
- 🔐 User authentication (email/password) with Better Auth
- 🎨 Custom model support for advanced users
- 💾 Locally saved preferences
- 🐳 Docker setup for easy deployment

## Prerequisites

- Node.js (LTS)
- At least one API key from supported providers (see below)
- Docker (recommended) **or** a MongoDB instance configured as a replica set

## Getting Started

### Web App — with Docker (recommended)

The easiest way to get started. Docker handles MongoDB setup automatically.

#### 1. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in at least one AI provider API key.

#### 2. Start the app

```bash
docker compose up
```

This starts the Next.js dev server (with hot-reload) and a MongoDB replica set. Open [http://localhost:3000](http://localhost:3000) to use the app.

### Web App — without Docker

#### 1. Install dependencies

```bash
npm install
```

#### 2. Set up environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and fill in at least one AI provider API key **and** a `MONGODB_URI` pointing to your MongoDB replica set.

#### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Mobile App (React Native)

The mobile client lives in the `mobile/` directory and is built with **Expo** (SDK 54) and **React Native**. It connects to the same Next.js API backend for sentence analysis and authentication.

#### 1. Install dependencies

```bash
cd mobile
npm install
```

#### 2. Start the Next.js backend

The mobile app requires the Next.js API server to be running. In a separate terminal from the project root:

```bash
npm run dev
# or: docker compose up
```

#### 3. Run the mobile app

```bash
cd mobile
npx expo start
```

From the Expo CLI you can open the app in:
- **iOS Simulator** — press `i`
- **Android Emulator** — press `a`
- **Physical device** — scan the QR code with Expo Go

> **Note:** Physical devices cannot reach `localhost` on your machine. Update `mobile/constants/api.ts` with your machine's local IP address or use a tunneling service like ngrok. The Android emulator uses `10.0.2.2` to access the host machine's localhost, which is already configured.

## Environment Variables

All variables live in `.env.local` (git-ignored). You can use `.env.local.example` as a template.

| Variable | Required | Purpose |
|----------|----------|---------|
| `MONGODB_URI` | Yes (auto-set in Docker) | MongoDB connection string (must be a replica set) |
| `BETTER_AUTH_URL` | No | Base URL for auth (defaults to `http://localhost:3000`) |
| `ANTHROPIC_API_KEY` | At least one AI key | [Anthropic](https://console.anthropic.com/) |
| `OPENAI_API_KEY` | At least one AI key | [OpenAI](https://platform.openai.com/api-keys) |
| `GOOGLE_API_KEY` | At least one AI key | [Google AI](https://makersuite.google.com/app/apikey) |
| `XAI_API_KEY` | At least one AI key | [xAI](https://console.x.ai/) |
| `OPENROUTER_API_KEY` | At least one AI key | [OpenRouter](https://openrouter.ai/keys) |
| `CEREBRAS_API_KEY` | At least one AI key | [Cerebras](https://cloud.cerebras.ai/) |
| `FIREWORKS_API_KEY` | At least one AI key | [Fireworks AI](https://fireworks.ai/) |

## How It Works

1. **Select Provider**: Choose your preferred AI provider from the settings (⚙️ icon)
2. **Input**: Enter a Japanese sentence in the input field, or upload an image containing Japanese text
3. **Analysis**: The sentence is sent to your selected AI provider which analyzes:
   - Individual words and their readings (hiragana)
   - Part of speech for each word
   - Sentence topic (marked with は particle)
   - Particles attached to their respective words
   - Grammatical relationships (which words modify which)
   - Grammar points with explanations
4. **Visualization**: The results are displayed as:
   - **Topic section** (purple box) - separated from main sentence as it provides context only
   - Interactive word boxes arranged in sentence order
   - **Small orange boxes** showing particles attached to words (click any particle to see what it does!)
   - Curved arrows showing modification relationships (topics don't have arrows since they don't modify the sentence)
   - Detailed explanation of sentence structure
   - Complete word breakdown with readings and parts of speech
   - Grammar points explaining key grammatical concepts used in the sentence

## Example Sentences

Try these examples:

- `私は美しい花を見ました。` (I saw beautiful flowers.)
- `猫が静かに部屋に入った。` (The cat quietly entered the room.)
- `彼女は新しい本を読んでいる。` (She is reading a new book.)

## Project Structure

```
common/                               # Shared code between web and mobile
├── api.ts                            # Shared API client (analyzeSentence)
├── providers.ts                      # Provider/model configuration (7 providers)
├── tailwind.config.js                # Shared Tailwind theme (single source of truth)
└── types.ts                          # Shared TypeScript types

src/                                  # Next.js web app
├── app/
│   ├── api/
│   │   ├── analyze/route.ts          # Sentence analysis API endpoint
│   │   └── auth/[...all]/route.ts    # Better Auth catch-all route
│   ├── sign-up/page.tsx              # Sign-up page
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Main page (server component, auth-aware)
│   └── globals.css                   # Global styles (imports shared theme)
├── components/
│   ├── ui/                           # Reusable UI primitives (shadcn-style)
│   ├── HomeContent.tsx               # Client component with interactive logic
│   ├── ImageUploadModal.tsx          # Image upload for text extraction
│   ├── SentenceInput.tsx             # Input form with image upload support
│   ├── SentenceVisualization.tsx     # React Flow visualization with arrows
│   ├── SettingsModal.tsx             # Provider and model selection modal
│   ├── ParticleModal.tsx             # Particle explanation modal
│   ├── SignInDialog.tsx              # Sign-in modal dialog
│   └── UserMenu.tsx                  # User profile + sign-out
├── lib/
│   ├── analysis/                     # Analysis logic (providers, schema, cache)
│   ├── auth.ts                       # Better Auth server config
│   ├── auth-client.ts               # Better Auth client (React hooks)
│   └── db.ts                         # MongoDB client singleton
├── providers/
│   └── settings-store-provider.tsx   # Zustand context provider
└── stores/
    └── settings-store.ts             # Zustand store (localStorage persistence)

mobile/                               # React Native (Expo) mobile app
├── app/
│   ├── (tabs)/                       # Bottom tab navigator
│   │   ├── _layout.tsx               # Tab bar config (Home + More)
│   │   ├── index.tsx                 # Home screen (sentence input, image picker)
│   │   └── more.tsx                  # Profile/settings hub (auth-aware)
│   ├── _layout.tsx                   # Root stack navigator + session preloader
│   ├── results.tsx                   # Analysis results screen
│   ├── settings.tsx                  # Provider & model settings
│   ├── sign-in.tsx                   # Sign-in screen
│   └── sign-up.tsx                   # Sign-up screen
├── components/                       # ThemedText, ThemedView, DependencyMap, etc.
├── constants/
│   └── api.ts                        # Platform-aware API URL configuration
├── hooks/
│   ├── use-color-scheme.ts           # Color scheme detection hook
│   └── use-raw-css-theme.ts          # Raw hex theme colors for RN APIs
├── lib/
│   └── auth-client.ts               # Better Auth client (Expo plugin, SecureStore)
├── stores/
│   └── settings-store.ts             # Zustand store with SecureStore persistence
└── package.json                      # Separate dependency manifest
```

## Technology Stack

### Web App
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI**: React 19, Radix UI, Lucide icons, shadcn-style components
- **Visualization**: React Flow (@xyflow/react)
- **Auth**: Better Auth (email/password)
- **Database**: MongoDB 7

### Mobile App
- **Framework**: React Native 0.81 with Expo SDK 54
- **Routing**: Expo Router (file-based, bottom tabs)
- **Styling**: NativeWind 4 (Tailwind CSS for React Native)
- **State Management**: Zustand with Expo SecureStore persistence
- **Auth**: Better Auth (Expo plugin)
- **Platforms**: iOS, Android, and Web

### Shared
- **AI Providers**: 
  - Anthropic Claude (Sonnet 4.5, Opus 4.5, Haiku 4.5)
  - OpenAI (GPT-5.2, o3, GPT-4o)
  - Google Gemini (3 Flash, 3 Pro, 2.5 Pro)
  - xAI Grok (4, 4 Heavy)
  - OpenRouter (Auto-routing)
  - Cerebras (Llama 4 Scout, Llama 3.3 70B)
  - Fireworks AI (Llama 4 Scout, Llama 4 Maverick)
- **AI Integration**: LangChain
- **Theme**: Shared Tailwind config (`common/tailwind.config.js`)
- **Language**: TypeScript

### Infrastructure
- **Containerization**: Docker (multi-stage Dockerfile, docker-compose)
- **Database**: MongoDB 7 (replica set, provisioned via Docker)
- **Auth**: Better Auth with MongoDB adapter

## API Endpoint

### POST `/api/analyze`

Analyzes a Japanese sentence and returns structured data.

**Request Body:**
```json
{
  "sentence": "私は美しい花を見ました。",
  "provider": "anthropic",
  "model": "claude-sonnet-4-5-20250929"
}
```

**Parameters:**
- `sentence` (required): The Japanese sentence to analyze
- `provider` (required): AI provider to use (`anthropic`, `openai`, `google`, `xai`, `openrouter`, `cerebras`, `fireworks`)
- `model` (required): Specific model name to use

**Response:**
```json
{
  "directTranslation": "I beautiful flower saw.",
  "words": [
    {
      "id": "1",
      "text": "私",
      "reading": "わたし",
      "partOfSpeech": "pronoun",
      "position": 0,
      "modifies": []
    }
  ],
  "explanation": "This sentence describes...",
  "grammarPoints": [
    {
      "title": "Past tense (ました)",
      "explanation": "The polite past tense form..."
    }
  ],
  "isFragment": false
}
```

### Auth Routes (`/api/auth/*`)

Authentication is handled by Better Auth's catch-all route. See [Better Auth docs](https://www.better-auth.com/) for available endpoints.

## Development

### Docker

```bash
docker compose up              # Start dev server + MongoDB
docker compose up --build      # Rebuild after Dockerfile changes
docker compose down            # Stop services
docker compose down -v         # Stop and remove data volume
```

### Linting

```bash
npm run lint                   # Web app (Biome)
cd mobile && npm run lint      # Mobile app (ESLint)
```

### Formatting

```bash
npm run format                 # Auto-format web app with Biome
```

### Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## License

ALL RIGHTS RESERVED

## Acknowledgments

- Powered by multiple AI providers:
  - [Anthropic Claude](https://www.anthropic.com/)
  - [OpenAI](https://openai.com/)
  - [Google Gemini](https://ai.google.dev/)
  - [xAI Grok](https://x.ai/)
  - [OpenRouter](https://openrouter.ai/)
  - [Cerebras](https://cerebras.ai/)
  - [Fireworks AI](https://fireworks.ai/)
- Authentication by [Better Auth](https://www.better-auth.com/)
- Built with [Next.js](https://nextjs.org/), [Expo](https://expo.dev/), and [LangChain](https://js.langchain.com/)
