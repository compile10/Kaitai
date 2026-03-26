import type { Provider } from "@common/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { useSettingsStore } from "@/providers/settings-store-provider";

interface ServerSettings {
  provider: Provider;
  model: string;
}

export const SETTINGS_QUERY_KEY = ["settings"] as const;

export function useSettingsQuery() {
  const { data: session } = authClient.useSession();
  const setProvider = useSettingsStore((s) => s.setProvider);
  const setModel = useSettingsStore((s) => s.setModel);

  return useQuery({
    queryKey: SETTINGS_QUERY_KEY,
    queryFn: async (): Promise<ServerSettings> => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to fetch settings");
      const data = await res.json();

      setProvider(data.provider);
      setModel(data.model);

      return { provider: data.provider, model: data.model };
    },
    enabled: !!session?.user,
  });
}

export function useSettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (settings: ServerSettings) => {
      const res = await fetch("/api/settings", {
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
      queryClient.setQueryData(SETTINGS_QUERY_KEY, settings);
    },
  });
}
