import { PROVIDER_MAP } from "@common/providers";
import type { Provider } from "@common/types";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

const DEFAULT_PROVIDER: Provider = "anthropic";

export type SettingsState = {
  provider: Provider;
  model: string;
};

export type SettingsActions = {
  setProvider: (provider: Provider) => void;
  setModel: (model: string) => void;
};

export type SettingsStore = SettingsState & SettingsActions;

export const defaultSettingsState: SettingsState = {
  provider: DEFAULT_PROVIDER,
  model: PROVIDER_MAP[DEFAULT_PROVIDER].defaultModel,
};

export const createSettingsStore = (
  initState: SettingsState = defaultSettingsState,
) => {
  return createStore<SettingsStore>()(
    persist(
      (set) => ({
        ...initState,
        setProvider: (provider) => {
          set({ provider, model: PROVIDER_MAP[provider].defaultModel });
        },
        setModel: (model) => set({ model }),
      }),
      {
        name: "kaitai-settings",
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
        partialize: (state) => ({
          provider: state.provider,
          model: state.model,
        }),
      },
    ),
  );
};
