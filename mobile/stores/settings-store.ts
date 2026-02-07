import { create } from 'zustand';
import { persist, createJSONStorage, StateStorage } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';
import type { Provider, ProviderConfig, ModelInfo } from '@common/types';
import { PROVIDER_MAP } from '@common/providers';

export type { Provider, ProviderConfig, ModelInfo };
export { PROVIDER_MAP };

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

