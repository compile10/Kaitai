"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { Provider, ProviderConfig, ModelInfo } from "@common/types";
import { PROVIDERS } from "@common/providers";

export type { ModelInfo, Provider, ProviderConfig };
export { PROVIDERS };

const DEFAULT_PROVIDER: Provider = "anthropic";
const STORAGE_KEY_PROVIDER = "kaitai-provider";
const STORAGE_KEY_MODEL = "kaitai-model";

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
