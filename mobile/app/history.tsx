import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  View,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRawCSSTheme } from "@/hooks/use-raw-css-theme";
import { buildApiUrl } from "@/constants/api";
import { authFetch } from "@/lib/auth-fetch";
import { formatRelativeTime } from "@/lib/format";
import { useSettingsStore, PROVIDER_MAP } from "@/stores/settings-store";
import type { HistoryEntry, PaginatedHistory } from "@common/types";

const PAGE_SIZE = 20;

/**
 * Resolve a provider ID + model ID to friendly display names.
 */
function getProviderModelLabel(providerId: string, modelId: string): string {
  const config = PROVIDER_MAP[providerId as keyof typeof PROVIDER_MAP];
  const providerName = config?.name ?? providerId;
  const modelName = config?.models.find((m) => m.id === modelId)?.name ?? modelId;
  return `${providerName} / ${modelName}`;
}

export default function HistoryScreen() {
  const [items, setItems] = useState<HistoryEntry[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expertMode = useSettingsStore((s) => s.expertMode);
  const tintColor = useRawCSSTheme("primary");
  const iconColor = useRawCSSTheme("muted-foreground");

  const fetchHistory = useCallback(
    async (pageNum: number, replace: boolean) => {
      try {
        const url = `${buildApiUrl("history")}?page=${pageNum}&limit=${PAGE_SIZE}`;
        const res = await authFetch(url);
        const data: PaginatedHistory = await res.json();

        if (!res.ok) {
          throw new Error(
            (data as unknown as { error: string }).error ||
              "Failed to fetch history",
          );
        }

        setItems((prev) => (replace ? data.items : [...prev, ...data.items]));
        setPage(data.page);
        setTotalPages(data.totalPages);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    },
    [],
  );

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    fetchHistory(1, true).finally(() => setIsLoading(false));
  }, [fetchHistory]);

  // Pull-to-refresh
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchHistory(1, true);
    setIsRefreshing(false);
  }, [fetchHistory]);

  // Load more (infinite scroll)
  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || page >= totalPages) return;
    setIsLoadingMore(true);
    await fetchHistory(page + 1, false);
    setIsLoadingMore(false);
  }, [isLoadingMore, page, totalPages, fetchHistory]);

  const handlePress = (entry: HistoryEntry) => {
    router.push({
      pathname: "/results",
      params: {
        historyId: entry.id,
        historyTitle: entry.sentence,
      },
    });
  };

  // --- Loading state ---
  if (isLoading) {
    return (
      <ThemedView className="flex-1 items-center justify-center" edges={["left", "right"]}>
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  // --- Error state ---
  if (error && items.length === 0) {
    return (
      <ThemedView className="flex-1 justify-center px-8" edges={["left", "right"]}>
        <View className="items-center gap-3">
          <Ionicons name="alert-circle-outline" size={48} color="#ef4444" />
          <ThemedText className="text-center opacity-80">{error}</ThemedText>
          <Pressable
            className="mt-4 px-6 py-3 rounded-xl bg-primary dark:bg-primary-dark"
            onPress={() => {
              setIsLoading(true);
              fetchHistory(1, true).finally(() => setIsLoading(false));
            }}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <ThemedText className="text-white font-semibold">Retry</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // --- Empty state ---
  if (items.length === 0) {
    return (
      <ThemedView className="flex-1 justify-center items-center px-12" edges={["left", "right"]}>
        <Ionicons name="time-outline" size={64} color={iconColor} />
        <ThemedText type="subtitle" className="mt-4 text-center">
          No History Yet
        </ThemedText>
        <ThemedText className="text-sm opacity-70 mt-2 text-center">
          Sentences you analyze will appear here.
        </ThemedText>
      </ThemedView>
    );
  }

  // --- List ---
  return (
    <ThemedView className="flex-1" edges={["left", "right"]}>
      <FlashList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 32 }}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        renderItem={({ item }) => (
          <Pressable
            className="py-4 border-b border-border dark:border-border-dark"
            onPress={() => handlePress(item)}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <View className="flex-row items-start justify-between gap-3">
              <ThemedText
                className="flex-1 text-base"
                numberOfLines={2}
              >
                {item.sentence}
              </ThemedText>
              <ThemedText className="text-xs opacity-50 mt-0.5">
                {formatRelativeTime(item.createdAt)}
              </ThemedText>
            </View>

            {expertMode && (
              <ThemedText className="text-xs opacity-50 mt-1">
                {getProviderModelLabel(item.provider, item.model)}
              </ThemedText>
            )}
          </Pressable>
        )}
        ListFooterComponent={
          isLoadingMore ? (
            <View className="py-4 items-center">
              <ActivityIndicator size="small" color={tintColor} />
            </View>
          ) : null
        }
      />
    </ThemedView>
  );
}
