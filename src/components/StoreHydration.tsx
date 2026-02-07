"use client";

import { useEffect } from "react";
import { useSettingsStore } from "@/stores/settings-store";

export function StoreHydration() {
  useEffect(() => {
    useSettingsStore.persist.rehydrate();
  }, []);

  return null;
}
