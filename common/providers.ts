import type { Provider, ProviderConfig } from "./types";

export const PROVIDER_MAP: Record<Provider, ProviderConfig> = {
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    defaultModel: "claude-sonnet-4-6",
    models: [
      {
        id: "claude-sonnet-4-6",
        name: "Claude Sonnet 4.6",
        description:
          "Latest balanced model for strong quality with fast responses",
        pricing: "$3.00 / $15.00 per MTok",
        speed: "Fast",
      },
      {
        id: "claude-opus-4-6",
        name: "Claude Opus 4.6",
        description:
          "Latest flagship model focused on maximum intelligence",
        pricing: "$5.00 / $25.00 per MTok",
        speed: "Moderate",
      },
      {
        id: "claude-haiku-4-5-20251001",
        name: "Claude Haiku 4.5",
        description: "Fastest low-latency model for lightweight tasks",
        pricing: "$1.00 / $5.00 per MTok",
        speed: "Fastest",
      },
    ],
  },
  openai: {
    id: "openai",
    name: "OpenAI",
    defaultModel: "gpt-5.4",
    models: [
      {
        id: "gpt-5.4",
        name: "GPT-5.4",
        description:
          "Latest flagship model with best overall capability",
        pricing: "$2.50 / $15.00 per MTok",
        speed: "Fast",
      },
      {
        id: "gpt-5.4-pro",
        name: "GPT-5.4 Pro",
        description:
          "Highest quality GPT-5.4 variant for toughest tasks",
        pricing: "See OpenAI pricing (model-specific)",
        speed: "Moderate",
      },
      {
        id: "gpt-5.3-chat-latest",
        name: "GPT-5.3 Chat (Latest)",
        description:
          "Rolling latest chat-optimized GPT-5.3 model alias",
        pricing: "See OpenAI pricing (rolling alias)",
        speed: "Fast",
      },
    ],
  },
  google: {
    id: "google",
    name: "Google Gemini",
    defaultModel: "gemini-3.1-pro-preview",
    models: [
      {
        id: "gemini-3.1-pro-preview",
        name: "Gemini 3.1 Pro Preview",
        description:
          "Latest high-capability Gemini preview model",
        pricing: "$2.00 / $12.00 per MTok (<=200k prompt)",
        speed: "Moderate",
      },
      {
        id: "gemini-3.1-flash-lite-preview",
        name: "Gemini 3.1 Flash Lite Preview",
        description:
          "Latest low-latency preview model for fast responses",
        pricing: "$0.25 / $1.50 per MTok",
        speed: "Fastest",
      },
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        description: "Stable high-quality model for complex reasoning tasks",
        pricing: "$1.25 / $10.00 per MTok (<=200k prompt)",
        speed: "Fast",
      },
    ],
  },
  xai: {
    id: "xai",
    name: "xAI",
    defaultModel: "grok-4.20-beta-0309-reasoning",
    models: [
      {
        id: "grok-4.20-beta-0309-reasoning",
        name: "Grok 4.20 Beta (Reasoning)",
        description: "Latest reasoning-focused Grok model",
        pricing: "$2.00 / $6.00 per MTok",
        speed: "Fast",
      },
      {
        id: "grok-4.20-beta-0309-non-reasoning",
        name: "Grok 4.20 Beta (Non-Reasoning)",
        description:
          "Latest non-reasoning variant for lower latency",
        pricing: "$2.00 / $6.00 per MTok",
        speed: "Fast",
      },
      {
        id: "grok-4-1-fast-reasoning",
        name: "Grok 4.1 Fast Reasoning",
        description: "Fast reasoning model with strong quality/speed balance",
        pricing: "$0.20 / $0.50 per MTok",
        speed: "Fast",
      },
    ],
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    defaultModel: "openrouter/auto",
    models: [
      {
        id: "openrouter/auto",
        name: "Auto Router",
        description:
          "Intelligent auto-routing to select the best model for each prompt",
        pricing: "Varies by route/model",
        speed: "Varies",
      },
      {
        id: "openai/gpt-5.4",
        name: "OpenAI GPT-5.4",
        description:
          "Latest GPT model available via OpenRouter",
        pricing: "$2.50 / $15.00 per MTok",
        speed: "Fast",
      },
      {
        id: "anthropic/claude-sonnet-4.6",
        name: "Anthropic Claude Sonnet 4.6",
        description:
          "Latest Claude Sonnet model through OpenRouter",
        pricing: "$3.00 / $15.00 per MTok",
        speed: "Fast",
      },
    ],
  },
  cerebras: {
    id: "cerebras",
    name: "Cerebras",
    defaultModel: "gpt-oss-120b",
    models: [
      {
        id: "gpt-oss-120b",
        name: "GPT OSS 120B",
        description: "Strong open model with excellent reasoning and coding quality",
        pricing: "$0.25 / $0.69 per MTok",
        speed: "~3000 tok/s",
      },
      {
        id: "qwen-3-235b-a22b-instruct-2507",
        name: "Qwen 3 235B A22B Instruct",
        description: "Largest and most capable latest model on Cerebras",
        pricing: "$0.60 / $1.20 per MTok",
        speed: "~3000 tok/s",
      },
      {
        id: "zai-glm-4.7",
        name: "Z.AI GLM 4.7",
        description: "Strong latest general-purpose reasoning model",
        pricing: "$2.25 / $2.75 per MTok",
        speed: "~3000 tok/s",
      },
      {
        id: "llama3.1-8b",
        name: "Llama 3.1 8B",
        description: "Lightweight model, fastest inference speed",
        pricing: "$0.10 / $0.10 per MTok",
        speed: "~2200 tok/s",
      },
    ],
  },
  fireworks: {
    id: "fireworks",
    name: "Fireworks AI",
    defaultModel: "accounts/fireworks/models/kimi-k2-instruct-0905",
    models: [
      {
        id: "accounts/fireworks/models/kimi-k2-instruct-0905",
        name: "Kimi K2 Instruct 0905",
        description:
          "Latest high-capability model available on Fireworks",
        pricing: "$0.60 / $2.50 per MTok",
        speed: "Fast",
      },
      {
        id: "accounts/fireworks/models/deepseek-v3p2",
        name: "DeepSeek V3.2",
        description: "Recent top-tier reasoning model with broad capability",
        pricing: "$0.56 / $1.68 per MTok",
        speed: "Fast",
      },
      {
        id: "accounts/fireworks/models/glm-5",
        name: "GLM-5",
        description:
          "Latest GLM generation model hosted by Fireworks",
        pricing: "$1.00 / $3.20 per MTok",
        speed: "Fast",
      },
    ],
  },
};

export const PROVIDERS: ProviderConfig[] = Object.values(PROVIDER_MAP);
