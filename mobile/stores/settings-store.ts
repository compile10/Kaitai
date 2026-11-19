import type { UserSettings } from "@common/types";
import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface SettingsState {
  /** Null until the server returns the account's settings. */
  settings: UserSettings | null;
  setSettings: (settings: UserSettings) => void;
  isHydrated: boolean;
  setHydrated: (state: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: null,
      setSettings: (settings) => set({ settings }),
      isHydrated: false,
      setHydrated: (isHydrated) => set({ isHydrated }),
    }),
    {
      name: "kaitai-settings",
      storage: createJSONStorage(() => ({
        getItem: (name) => SecureStore.getItemAsync(name),
        setItem: (name, value) => SecureStore.setItemAsync(name, value),
        removeItem: (name) => SecureStore.deleteItemAsync(name),
      })),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      partialize: (state) => ({
        settings: state.settings,
      }),
    },
  ),
);
