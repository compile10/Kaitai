import {
  DEFAULT_MODEL,
  DEFAULT_PROVIDER,
  PROVIDER_MAP,
} from "@common/providers";
import type { ModelInfo, Provider, ProviderConfig } from "@common/types";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type { Provider, ProviderConfig, ModelInfo };
export { PROVIDER_MAP };

interface SettingsState {
  provider: Provider;
  model: string;
  useCustomModel: boolean;
  expertMode: boolean;
  isHydrated: boolean;
  setProvider: (provider: Provider) => void;
  setModel: (model: string) => void;
  setUseCustomModel: (value: boolean) => void;
  setExpertMode: (value: boolean) => void;
  setHydrated: (state: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      provider: DEFAULT_PROVIDER,
      model: DEFAULT_MODEL,
      useCustomModel: false,
      expertMode: false,
      isHydrated: false,
      setProvider: (provider: Provider) => {
        set({
          provider,
          model: PROVIDER_MAP[provider]?.defaultModel ?? "",
          useCustomModel: false,
        });
      },
      setModel: (model: string) => set({ model }),
      setUseCustomModel: (useCustomModel: boolean) => set({ useCustomModel }),
      setExpertMode: (expertMode: boolean) => set({ expertMode }),
      setHydrated: (state: boolean) => set({ isHydrated: state }),
    }),
    {
      name: "kaitai-settings",
      storage: createJSONStorage(() => ({
        getItem: (name: string) => SecureStore.getItemAsync(name),
        setItem: (name: string, value: string) => {
          SecureStore.setItemAsync(name, value);
        },
        removeItem: (name: string) => {
          SecureStore.deleteItemAsync(name);
        },
      })),
      onRehydrateStorage: () => (state) => {
        if (state && state.useCustomModel === undefined) {
          state.setUseCustomModel(false);
        }
        if (state && state.expertMode === undefined) {
          state.setExpertMode(false);
        }
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        provider: state.provider,
        model: state.model,
        useCustomModel: state.useCustomModel,
        expertMode: state.expertMode,
      }),
    },
  ),
);
