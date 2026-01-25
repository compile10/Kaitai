"use client";

import { useState, useEffect } from "react";

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  pricing: string;
  speed: string;
}

export const MODELS: ModelInfo[] = [
  {
    id: "claude-opus-4-5-20251101",
    name: "Claude Opus 4.5",
    description: "Premium model combining maximum intelligence with practical performance",
    pricing: "$5 / $25 per MTok",
    speed: "Moderate",
  },
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    description: "Best balance of intelligence, speed, and cost for most use cases",
    pricing: "$3 / $15 per MTok",
    speed: "Fast",
  },
  {
    id: "claude-haiku-4-5-20251001",
    name: "Claude Haiku 4.5",
    description: "Fastest model with near-frontier intelligence",
    pricing: "$1 / $5 per MTok",
    speed: "Fastest",
  },
];

const DEFAULT_MODEL = "claude-sonnet-4-5-20250929";
const STORAGE_KEY = "jpnalysis-model-preference";

export function useSettings() {
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODEL);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && MODELS.some((m) => m.id === stored)) {
        setSelectedModel(stored);
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage when model changes
  const updateModel = (modelId: string) => {
    setSelectedModel(modelId);
    try {
      localStorage.setItem(STORAGE_KEY, modelId);
    } catch (error) {
      console.error("Failed to save settings to localStorage:", error);
    }
  };

  return {
    selectedModel,
    updateModel,
    isLoaded,
    models: MODELS,
  };
}
