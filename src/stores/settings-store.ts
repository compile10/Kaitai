import { DEFAULT_USER_SETTINGS, type UserSettings } from "@common/types";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

export type SettingsState = { settings: UserSettings };
export type SettingsActions = { setSettings: (settings: UserSettings) => void };
export type SettingsStore = SettingsState & SettingsActions;
export const defaultSettingsState: SettingsState = {
  settings: { ...DEFAULT_USER_SETTINGS },
};

export const createSettingsStore = (
  initState: SettingsState = defaultSettingsState,
) => {
  return createStore<SettingsStore>()(
    persist(
      (set) => ({
        ...initState,
        setSettings: (settings) =>
          set({ settings: { ...DEFAULT_USER_SETTINGS, ...settings } }),
      }),
      {
        name: "kaitai-settings",
        storage: createJSONStorage(() => localStorage),
        skipHydration: true,
        partialize: (state) => ({ settings: state.settings }),
      },
    ),
  );
};
