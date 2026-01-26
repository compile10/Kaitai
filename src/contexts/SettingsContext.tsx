"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Provider, ProviderConfig, ModelInfo } from "@/types/analysis";

export type { ModelInfo, Provider, ProviderConfig };

export const PROVIDERS: ProviderConfig[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    defaultModel: "claude-sonnet-4-5-20250929",
    models: [
      {
        id: "claude-sonnet-4-5-20250929",
        name: "Claude Sonnet 4.5",
        description: "Best balance of intelligence, speed, and cost for most use cases",
        pricing: "$3 / $15 per MTok",
        speed: "Fast",
      },
      {
        id: "claude-opus-4-5-20251101",
        name: "Claude Opus 4.5",
        description: "Premium model combining maximum intelligence with practical performance",
        pricing: "$5 / $25 per MTok",
        speed: "Moderate",
      },
      {
        id: "claude-haiku-4-5-20251001",
        name: "Claude Haiku 4.5",
        description: "Fastest model with near-frontier intelligence",
        pricing: "$1 / $5 per MTok",
        speed: "Fastest",
      },
    ],
  },
  {
    id: "openai",
    name: "OpenAI",
    defaultModel: "gpt-5.2",
    models: [
      {
        id: "gpt-5.2",
        name: "GPT-5.2",
        description: "Best model for coding and agentic tasks across industries",
        pricing: "$1.75 / $14.00 per MTok",
        speed: "Fast",
      },
      {
        id: "gpt-5.2-pro",
        name: "GPT-5.2 Pro",
        description: "Version of GPT-5.2 that produces smarter and more precise responses",
        pricing: "$21.00 / $168.00 per MTok",
        speed: "Moderate",
      },
      {
        id: "gpt-5-mini",
        name: "GPT-5 Mini",
        description: "Faster, cost-efficient version of GPT-5 for well-defined tasks",
        pricing: "$0.25 / $2.00 per MTok",
        speed: "Fast",
      },
      {
        id: "gpt-5-nano",
        name: "GPT-5 Nano",
        description: "Fastest, most cost-efficient version of GPT-5",
        pricing: "$0.05 / $0.40 per MTok",
        speed: "Fastest",
      },
    ],
  },
  {
    id: "google",
    name: "Google Gemini",
    defaultModel: "gemini-3-flash-preview",
    models: [
      {
        id: "gemini-3-flash-preview",
        name: "Gemini 3 Flash",
        description: "Latest generation balanced model for speed and intelligence",
        pricing: "$0.50 / $3.00 per MTok",
        speed: "Fastest",
      },
      {
        id: "gemini-3-pro-preview",
        name: "Gemini 3 Pro",
        description: "Most intelligent model with state-of-the-art reasoning",
        pricing: "$2.00 / $12.00 per MTok",
        speed: "Moderate",
      },
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        description: "Advanced thinking model with complex reasoning capabilities",
        pricing: "$1.25 / $10.00 per MTok",
        speed: "Moderate",
      },
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        description: "Fast model with improved efficiency and agentic tool use",
        pricing: "$0.30 / $2.50 per MTok",
        speed: "Fast",
      },
    ],
  },
  {
    id: "xai",
    name: "xAI",
    defaultModel: "grok-4-1-fast-reasoning",
    models: [
      {
        id: "grok-4-1-fast-reasoning",
        name: "Grok 4.1 Fast Reasoning",
        description: "Enhanced reasoning model optimized for speed",
        pricing: "$2.00 / $10.00 per MTok",
        speed: "Fast",
      },
      {
        id: "grok-4",
        name: "Grok 4",
        description: "Latest flagship model with real-time search and multimodal capabilities",
        pricing: "$3.00 / $15.00 per MTok",
        speed: "Fast",
      },
      {
        id: "grok-3-mini",
        name: "Grok Mini 3",
        description: "Compact model optimized for speed and cost efficiency",
        pricing: "$0.50 / $2.50 per MTok",
        speed: "Fastest",
      },
    ],
  },
  {
    id: "openrouter",
    name: "OpenRouter",
    defaultModel: "openrouter/auto",
    models: [
      {
        id: "openrouter/auto",
        name: "Auto Router",
        description: "Intelligent auto-routing to select the best model for each prompt",
        pricing: "Varies by model",
        speed: "Varies",
      },
      {
        id: "z-ai/glm-4.7",
        name: "Z.AI GLM 4.7",
        description: "Enhanced programming and reasoning with 202K context window",
        pricing: "$0.40 / $1.50 per MTok",
        speed: "Fast",
      },
      {
        id: "mistralai/ministral-14b-2512",
        name: "Mistral Ministral 3 14B",
        description: "Frontier model with vision capabilities and 262K context window",
        pricing: "$0.20 / $0.20 per MTok",
        speed: "Fast",
      },
    ],
  },
];

const DEFAULT_PROVIDER: Provider = "anthropic";
const STORAGE_KEY_PROVIDER = "jpnalysis-provider";
const STORAGE_KEY_MODEL = "jpnalysis-model";

interface SettingsContextType {
  provider: Provider;
  model: string;
  updateProvider: (provider: Provider) => void;
  updateModel: (modelId: string) => void;
  isLoaded: boolean;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<Provider>(DEFAULT_PROVIDER);
  const [model, setModel] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedProvider = localStorage.getItem(STORAGE_KEY_PROVIDER) as Provider | null;
      const storedModel = localStorage.getItem(STORAGE_KEY_MODEL);

      // Set provider
      const loadedProvider = storedProvider && PROVIDERS.find((p) => p.id === storedProvider)
        ? storedProvider
        : DEFAULT_PROVIDER;
      setProvider(loadedProvider);

      // Set model
      const providerConfig = PROVIDERS.find((p) => p.id === loadedProvider);
      const loadedModel = storedModel || providerConfig?.defaultModel || "";
      setModel(loadedModel);
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Update provider
  const updateProvider = (newProvider: Provider) => {
    setProvider(newProvider);
    const providerConfig = PROVIDERS.find((p) => p.id === newProvider);
    const newModel = providerConfig?.defaultModel || "";
    setModel(newModel);
    try {
      localStorage.setItem(STORAGE_KEY_PROVIDER, newProvider);
      localStorage.setItem(STORAGE_KEY_MODEL, newModel);
    } catch (error) {
      console.error("Failed to save provider to localStorage:", error);
    }
  };

  // Update model
  const updateModel = (modelId: string) => {
    setModel(modelId);
    try {
      localStorage.setItem(STORAGE_KEY_MODEL, modelId);
    } catch (error) {
      console.error("Failed to save model to localStorage:", error);
    }
  };

  const value: SettingsContextType = {
    provider,
    model,
    updateProvider,
    updateModel,
    isLoaded,
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
