import { PROVIDERS } from "@common/providers";
import type { Provider } from "@common/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

const DEFAULT_PROVIDER: Provider = "anthropic";

// Noop storage for SSR
const noopStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
};

interface SettingsState {
  provider: Provider;
  model: string;
  isHydrated: boolean;
  setProvider: (provider: Provider) => void;
  setModel: (model: string) => void;
  setHydrated: (state: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      provider: DEFAULT_PROVIDER,
      model:
        PROVIDERS.find((p) => p.id === DEFAULT_PROVIDER)?.defaultModel ?? "",
      isHydrated: false,
      setProvider: (provider) => {
        const config = PROVIDERS.find((p) => p.id === provider);
        set({ provider, model: config?.defaultModel ?? "" });
      },
      setModel: (model) => set({ model }),
      setHydrated: (state) => set({ isHydrated: state }),
    }),
    {
      name: "kaitai-settings",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : noopStorage,
      ),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        provider: state.provider,
        model: state.model,
      }),
    },
  ),
);
