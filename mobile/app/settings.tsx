import { ActivityIndicator, ScrollView, Switch, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useRawCSSTheme } from "@/hooks/use-raw-css-theme";
import {
  useSettingsMutation,
  useSettingsQuery,
} from "@/hooks/use-settings-sync";

export default function SettingsScreen() {
  const query = useSettingsQuery();
  const mutation = useSettingsMutation();
  const tintColor = useRawCSSTheme("primary");

  if (query.isLoading) {
    return (
      <ThemedView
        className="flex-1 items-center justify-center gap-4 pb-24"
        edges={["left", "right"]}
      >
        <ActivityIndicator size="large" color={tintColor} />
        <ThemedText className="text-muted-foreground">
          Loading settings...
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1" edges={["left", "right"]}>
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mb-6 mt-5">
          <ThemedText type="subtitle" className="mb-2">
            General
          </ThemedText>
          <View className="flex-row items-center gap-4 mt-4">
            <View className="flex-1">
              <ThemedText type="defaultSemiBold">
                Show word translations
              </ThemedText>
              <ThemedText className="text-sm opacity-70 mt-1">
                Show English meanings in sentence graph cells. When off, select a
                cell and use its eye button to reveal the translation.
              </ThemedText>
            </View>
            <Switch
              accessibilityLabel="Show word translations"
              value={query.data?.showWordTranslations ?? false}
              disabled={!query.data || query.isFetching || mutation.isPending}
              onValueChange={(showWordTranslations) =>
                mutation.mutate({ showWordTranslations })
              }
              trackColor={{ true: tintColor }}
            />
          </View>
          {(mutation.error || query.error) && (
            <ThemedText
              className="text-sm text-destructive mt-2"
              accessibilityRole="alert"
            >
              {mutation.error?.message || query.error?.message}
            </ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
