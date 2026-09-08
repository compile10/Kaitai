import type { UserSettings } from "@common/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useSettingsStore } from "@/providers/settings-store-provider";

export const SETTINGS_QUERY_KEY = ["settings"] as const;

export function useSettingsQuery() {
  const { data: session } = authClient.useSession();
  const setSettings = useSettingsStore((s) => s.setSettings);

  return useQuery({
    queryKey: [...SETTINGS_QUERY_KEY, session?.user.id],
    queryFn: async (): Promise<UserSettings> => {
      const res = await fetch("/api/settings");
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

export function useSettingsMutation() {
  const { data: session } = authClient.useSession();
  const queryClient = useQueryClient();
  const setSettings = useSettingsStore((s) => s.setSettings);

  return useMutation({
    mutationFn: async (settings: UserSettings) => {
      const res = await fetch("/api/settings", {
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
      queryClient.setQueryData(
        [...SETTINGS_QUERY_KEY, session?.user.id],
        settings,
      );
    },
  });
}
