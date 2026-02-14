"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useStore } from "zustand";
import {
  createSettingsStore,
  type SettingsStore,
} from "@/stores/settings-store";

export type SettingsStoreApi = ReturnType<typeof createSettingsStore>;

interface SettingsStoreContextValue {
  store: SettingsStoreApi;
  isHydrated: boolean;
}

const SettingsStoreContext = createContext<
  SettingsStoreContextValue | undefined
>(undefined);

export function SettingsStoreProvider({ children }: { children: ReactNode }) {
  const storeRef = useRef<SettingsStoreApi>(null);
  if (!storeRef.current) {
    storeRef.current = createSettingsStore();
  }

  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    storeRef.current?.persist.rehydrate();
    setIsHydrated(true);
  }, []);

  return (
    <SettingsStoreContext value={{ store: storeRef.current, isHydrated }}>
      {children}
    </SettingsStoreContext>
  );
}

export function useSettingsStore<T>(selector: (state: SettingsStore) => T): T {
  const context = useContext(SettingsStoreContext);
  if (!context) {
    throw new Error(
      "useSettingsStore must be used within SettingsStoreProvider",
    );
  }
  return useStore(context.store, selector);
}

export function useIsHydrated(): boolean {
  const context = useContext(SettingsStoreContext);
  if (!context) {
    throw new Error("useIsHydrated must be used within SettingsStoreProvider");
  }
  return context.isHydrated;
}
