import type { Provider } from "@common/types";
import { ChatAnthropic } from "@langchain/anthropic";
import { ChatCerebras } from "@langchain/cerebras";
import { ChatFireworks } from "@langchain/community/chat_models/fireworks";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { ChatXAI } from "@langchain/xai";

// Provider configuration
export const PROVIDER_CONFIG = {
  anthropic: {
    name: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
  },
  openai: {
    name: "OpenAI",
    envKey: "OPENAI_API_KEY",
  },
  google: {
    name: "Google Gemini",
    envKey: "GOOGLE_API_KEY",
  },
  xai: {
    name: "xAI",
    envKey: "XAI_API_KEY",
  },
  openrouter: {
    name: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
  },
  cerebras: {
    name: "Cerebras",
    envKey: "CEREBRAS_API_KEY",
  },
  fireworks: {
    name: "Fireworks AI",
    envKey: "FIREWORKS_API_KEY",
  },
} as const;

// Provider factory function
export function createChatModel(provider: Provider, model: string) {
  const config = PROVIDER_CONFIG[provider];
  const apiKey = process.env[config.envKey];

  if (!apiKey) {
    throw new Error(`Server Error: Key not properly set for ${config.name}.`);
  }

  switch (provider) {
    case "anthropic":
      return new ChatAnthropic({
        model,
        anthropicApiKey: apiKey,
        maxTokens: 4096,
      });

    case "openai":
      return new ChatOpenAI({
        model,
        openAIApiKey: apiKey,
        maxTokens: 4096,
      });

    case "google":
      return new ChatGoogleGenerativeAI({
        model,
        apiKey,
        maxOutputTokens: 4096,
      });

    case "xai":
      return new ChatXAI({
        model,
        apiKey,
        maxTokens: 4096,
      });

    case "openrouter":
      return new ChatOpenAI({
        model,
        configuration: {
          apiKey,
          baseURL: "https://openrouter.ai/api/v1",
        },
        maxTokens: 4096,
      });

    case "cerebras":
      return new ChatCerebras({
        model,
        apiKey,
        maxTokens: 4096,
      });

    case "fireworks":
      return new ChatFireworks({
        model,
        apiKey,
        maxTokens: 4096,
      });

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
