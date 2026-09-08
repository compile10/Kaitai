import type { UserSettings } from "@common/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/constants/api";
import { authClient } from "@/lib/auth-client";
import { authFetch } from "@/lib/auth-fetch";
import { useSettingsStore } from "@/stores/settings-store";

export const SETTINGS_KEY = ["settings"] as const;

/**
 * Fetches the authenticated user's saved settings from the server.
 * Disabled when the user is not signed in.
 */
export function useSettingsQuery() {
  const { data: session } = authClient.useSession();
  const setSettings = useSettingsStore((s) => s.setSettings);

  return useQuery({
    queryKey: [...SETTINGS_KEY, session?.user.id],
    queryFn: async (): Promise<UserSettings> => {
      const res = await authFetch(`${API_BASE_URL}/api/settings`);
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.error || "Failed to fetch settings");
      }
      const data: UserSettings = await res.json();

      setSettings(data);

      return data;
    },
    enabled: !!session?.user,
  });
}

/**
 * Mutation that persists account preference changes to the server.
 * Updates the TanStack Query cache on success.
 */
export function useSettingsMutation() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const setSettings = useSettingsStore((s) => s.setSettings);

  return useMutation({
    mutationFn: async (settings: UserSettings) => {
      const res = await authFetch(`${API_BASE_URL}/api/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save settings");
      }
      return (await res.json()) as UserSettings;
    },
    onSuccess: (settings) => {
      setSettings(settings);
      queryClient.setQueryData([...SETTINGS_KEY, session?.user.id], settings);
    },
  });
}
