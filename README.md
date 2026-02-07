# 日本語 Sentence Analyzer (JPnalysis)
<img width="986" height="994" alt="image" src="https://github.com/user-attachments/assets/ef6d63e0-dc00-40a1-8635-4071759008c4" />

A Next.js application that analyzes Japanese sentence structure using AI. This tool visualizes how words and phrases relate to each other, showing grammatical relationships with interactive diagrams.

## Features

- 🎯 AI-powered Japanese sentence analysis with multiple provider support
- 🤖 Support for 5 AI providers: Anthropic Claude, OpenAI, Google Gemini, xAI Grok, and OpenRouter
- 📊 Visual representation of sentence structure with arrows showing modification relationships
- 🇯🇵 Support for any Japanese sentence
- ⚡ Real-time analysis with structured JSON output
- 🎨 Custom model support for advanced users
- 💾 Locally saved preferences

## Prerequisites

- Node.js 18+ 
- At least one API key from supported providers:
  - [Anthropic](https://console.anthropic.com/)
  - [OpenAI](https://platform.openai.com/api-keys)
  - [Google AI](https://makersuite.google.com/app/apikey)
  - [xAI](https://console.x.ai/)
  - [OpenRouter](https://openrouter.ai/keys)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Create a `.env.local` file in the root directory with at least one provider API key:

```bash
# At least one of these is required
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
XAI_API_KEY=your_xai_api_key_here
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

Replace the placeholder values with your actual API keys. You can use `.env.local.example` as a template.

### 3. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## How It Works

1. **Select Provider**: Choose your preferred AI provider from the settings (⚙️ icon)
2. **Input**: Enter a Japanese sentence in the input field
3. **Analysis**: The sentence is sent to your selected AI provider which analyzes:
   - Individual words and their readings (hiragana)
   - Part of speech for each word
   - Sentence topic (marked with は particle)
   - Particles attached to their respective words
   - Grammatical relationships (which words modify which)
4. **Visualization**: The results are displayed as:
   - **Topic section** (purple box) - separated from main sentence as it provides context only
   - Interactive word boxes arranged in sentence order
   - **Small orange boxes** showing particles attached to words (click any particle to see what it does!)
   - Curved arrows showing modification relationships (topics don't have arrows since they don't modify the sentence)
   - Detailed explanation of sentence structure
   - Complete word breakdown with readings and parts of speech

## Example Sentences

Try these examples:

- `私は美しい花を見ました。` (I saw beautiful flowers.)
- `猫が静かに部屋に入った。` (The cat quietly entered the room.)
- `彼女は新しい本を読んでいる。` (She is reading a new book.)

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts          # API endpoint with multi-provider support
│   ├── page.tsx                   # Main page component
│   └── globals.css                # Global styles
├── components/
│   ├── SentenceInput.tsx          # Input form component
│   ├── SentenceVisualization.tsx  # Visualization component with arrows
│   ├── SettingsModal.tsx          # Provider and model selection modal
│   └── ParticleModal.tsx          # Particle explanation modal
├── hooks/
│   └── useSettings.ts             # Settings management hook
└── types/
    └── analysis.ts                # TypeScript types for analysis data
```

## Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Providers**: 
  - Anthropic Claude (Sonnet 4.5, Opus 4.5, Haiku 4.5)
  - OpenAI (GPT-5.2, o3, GPT-4o)
  - Google Gemini (3 Flash, 3 Pro, 2.5 Pro)
  - xAI Grok (4, 4 Heavy)
  - OpenRouter (Auto-routing)
- **AI Integration**: LangChain
- **UI**: React 19

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
- `provider` (required): AI provider to use (`anthropic`, `openai`, `google`, `xai`, `openrouter`)
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
    },
    // ... more words
  ],
  "explanation": "This sentence describes...",
  "isFragment": false
}
```

## Development

### Linting

```bash
npm run lint
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

MIT

## Acknowledgments

- Powered by multiple AI providers:
  - [Anthropic Claude](https://www.anthropic.com/)
  - [OpenAI](https://openai.com/)
  - [Google Gemini](https://ai.google.dev/)
  - [xAI Grok](https://x.ai/)
  - [OpenRouter](https://openrouter.ai/)
- Built with [Next.js](https://nextjs.org/) and [LangChain](https://js.langchain.com/)
