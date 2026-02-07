import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

// Types matching the web app
export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  pricing?: string;
  speed?: string;
}

export type Provider = 'anthropic' | 'openai' | 'google' | 'xai' | 'openrouter';

export interface ProviderConfig {
  id: Provider;
  name: string;
  models: ModelInfo[];
  defaultModel: string;
}

// Provider configurations (copied from web app), keyed by id for O(1) lookup
export const PROVIDER_MAP: Record<Provider, ProviderConfig> = {
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    defaultModel: 'claude-sonnet-4-5-20250929',
    models: [
      {
        id: 'claude-sonnet-4-5-20250929',
        name: 'Claude Sonnet 4.5',
        description: 'Best balance of intelligence, speed, and cost for most use cases',
        pricing: '$3 / $15 per MTok',
        speed: 'Fast',
      },
      {
        id: 'claude-opus-4-5-20251101',
        name: 'Claude Opus 4.5',
        description: 'Premium model combining maximum intelligence with practical performance',
        pricing: '$5 / $25 per MTok',
        speed: 'Moderate',
      },
      {
        id: 'claude-haiku-4-5-20251001',
        name: 'Claude Haiku 4.5',
        description: 'Fastest model with near-frontier intelligence',
        pricing: '$1 / $5 per MTok',
        speed: 'Fastest',
      },
    ],
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    defaultModel: 'gpt-5.2',
    models: [
      {
        id: 'gpt-5.2',
        name: 'GPT-5.2',
        description: 'Best model for coding and agentic tasks across industries',
        pricing: '$1.75 / $14.00 per MTok',
        speed: 'Fast',
      },
      {
        id: 'gpt-5.2-pro',
        name: 'GPT-5.2 Pro',
        description: 'Version of GPT-5.2 that produces smarter and more precise responses',
        pricing: '$21.00 / $168.00 per MTok',
        speed: 'Moderate',
      },
      {
        id: 'gpt-5-mini',
        name: 'GPT-5 Mini',
        description: 'Faster, cost-efficient version of GPT-5 for well-defined tasks',
        pricing: '$0.25 / $2.00 per MTok',
        speed: 'Fast',
      },
    ],
  },
  google: {
    id: 'google',
    name: 'Google Gemini',
    defaultModel: 'gemini-3-flash-preview',
    models: [
      {
        id: 'gemini-3-flash-preview',
        name: 'Gemini 3 Flash',
        description: 'Latest generation balanced model for speed and intelligence',
        pricing: '$0.50 / $3.00 per MTok',
        speed: 'Fastest',
      },
      {
        id: 'gemini-3-pro-preview',
        name: 'Gemini 3 Pro',
        description: 'Most intelligent model with state-of-the-art reasoning',
        pricing: '$2.00 / $12.00 per MTok',
        speed: 'Moderate',
      },
      {
        id: 'gemini-2.5-pro',
        name: 'Gemini 2.5 Pro',
        description: 'Advanced thinking model with complex reasoning capabilities',
        pricing: '$1.25 / $10.00 per MTok',
        speed: 'Moderate',
      },
      {
        id: 'gemini-2.5-flash',
        name: 'Gemini 2.5 Flash',
        description: 'Fast model with improved efficiency and agentic tool use',
        pricing: '$0.30 / $2.50 per MTok',
        speed: 'Fast',
      },
    ],
  },
  xai: {
    id: 'xai',
    name: 'xAI',
    defaultModel: 'grok-4-1-fast-reasoning',
    models: [
      {
        id: 'grok-4-1-fast-reasoning',
        name: 'Grok 4.1 Fast Reasoning',
        description: 'Enhanced reasoning model optimized for speed',
        pricing: '$2.00 / $10.00 per MTok',
        speed: 'Fast',
      },
      {
        id: 'grok-4',
        name: 'Grok 4',
        description: 'Latest flagship model with real-time search and multimodal capabilities',
        pricing: '$3.00 / $15.00 per MTok',
        speed: 'Fast',
      },
      {
        id: 'grok-3-mini',
        name: 'Grok Mini 3',
        description: 'Compact model optimized for speed and cost efficiency',
        pricing: '$0.50 / $2.50 per MTok',
        speed: 'Fastest',
      },
    ],
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    defaultModel: 'openrouter/auto',
    models: [
      {
        id: 'openrouter/auto',
        name: 'Auto Router',
        description: 'Intelligent auto-routing to select the best model for each prompt',
        pricing: 'Varies by model',
        speed: 'Varies',
      },
      {
        id: 'z-ai/glm-4.7',
        name: 'Z.AI GLM 4.7',
        description: 'Enhanced programming and reasoning with 202K context window',
        pricing: '$0.40 / $1.50 per MTok',
        speed: 'Fast',
      },
      {
        id: 'mistralai/ministral-14b-2512',
        name: 'Mistral Ministral 3 14B',
        description: 'Frontier model with vision capabilities and 262K context window',
        pricing: '$0.20 / $0.20 per MTok',
        speed: 'Fast',
      },
    ],
  },
};

const DEFAULT_PROVIDER: Provider = 'anthropic';
const DEFAULT_MODEL = PROVIDER_MAP[DEFAULT_PROVIDER].defaultModel;

// Custom storage adapter for expo-secure-store to implement Zustand's storage interface
const secureStorage: StateStorage = {
  getItem: (name: string) => SecureStore.getItemAsync(name),
  setItem: (name: string, value: string) => SecureStore.setItemAsync(name, value),
  removeItem: (name: string) => SecureStore.deleteItemAsync(name),
};

interface SettingsState {
  provider: Provider;
  model: string;
  useCustomModel: boolean;
  isHydrated: boolean;
  setProvider: (provider: Provider) => void;
  setModel: (model: string) => void;
  setUseCustomModel: (value: boolean) => void;
  setHydrated: (state: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      provider: DEFAULT_PROVIDER,
      model: DEFAULT_MODEL,
      useCustomModel: false,
      isHydrated: false,
      setProvider: (provider: Provider) => {
        set({
          provider,
          model: PROVIDER_MAP[provider]?.defaultModel ?? '',
          useCustomModel: false,
        });
      },
      setModel: (model: string) => set({ model }),
      setUseCustomModel: (useCustomModel: boolean) => set({ useCustomModel }),
      setHydrated: (state: boolean) => set({ isHydrated: state }),
    }),
    {
      name: 'jpnalysis-settings',
      storage: createJSONStorage(() => secureStorage),
      onRehydrateStorage: () => (state) => {
        if (state && state.useCustomModel === undefined) {
          state.setUseCustomModel(false);
        }
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        provider: state.provider,
        model: state.model,
        useCustomModel: state.useCustomModel,
      }),
    }
  )
);

