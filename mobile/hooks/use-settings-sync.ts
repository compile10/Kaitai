import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Provider } from "@common/types";
import { API_BASE_URL } from "@/constants/api";
import { authClient } from "@/lib/auth-client";
import { authFetch } from "@/lib/auth-fetch";
import { useSettingsStore } from "@/stores/settings-store";

interface ServerSettings {
  provider: Provider;
  model: string;
}

export const SETTINGS_KEY = ["settings"] as const;

/**
 * Fetches the authenticated user's saved settings from the server.
 * Disabled when the user is not signed in.
 */
export function useSettingsQuery() {
  const { data: session } = authClient.useSession();
  const setProvider = useSettingsStore((s) => s.setProvider);
  const setModel = useSettingsStore((s) => s.setModel);

  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: async (): Promise<ServerSettings> => {
      const res = await authFetch(`${API_BASE_URL}/api/settings`);
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data: ServerSettings = await res.json();

      setProvider(data.provider);
      setModel(data.model);

      return data;
    },
    enabled: !!session?.user,
  });
}

/**
 * Mutation that persists provider/model changes to the server.
 * Updates the TanStack Query cache on success.
 */
export function useSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: ServerSettings) => {
      const res = await authFetch(`${API_BASE_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save settings");
      }
      return settings;
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(SETTINGS_KEY, settings);
    },
  });
}
