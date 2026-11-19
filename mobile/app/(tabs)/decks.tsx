import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { DeckRow } from "@/components/decks/deck-row";
import { ProgressBanner } from "@/components/decks/progress-banner";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAccountProgress } from "@/hooks/use-account-progress";
import { useRawCSSTheme } from "@/hooks/use-raw-css-theme";
import { authClient } from "@/lib/auth-client";
import { DUMMY_STARTER_DECKS, DUMMY_YOUR_DECKS } from "@/lib/dummy-decks";

function SectionLabel({ children }: { children: string }) {
  return (
    <ThemedText className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-6 mb-2.5">
      {children}
    </ThemedText>
  );
}

export default function DecksScreen() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const progress = useAccountProgress();
  const foregroundColor = useRawCSSTheme("foreground");
  const tintColor = useRawCSSTheme("primary");
  const iconColor = useRawCSSTheme("muted-foreground");

  if (isSessionPending) {
    return (
      <ThemedView
        className="flex-1 items-center justify-center pb-24"
        edges={["top", "left", "right"]}
      >
        <ActivityIndicator size="large" color={tintColor} />
      </ThemedView>
    );
  }

  if (!session?.user) {
    return (
      <ThemedView
        className="flex-1 items-center justify-center px-12 pb-24"
        edges={["top", "left", "right"]}
      >
        <Ionicons name="albums-outline" size={72} color={iconColor} />
        <ThemedText type="subtitle" className="mt-4 text-center">
          Study with flashcard decks
        </ThemedText>
        <ThemedText className="text-sm opacity-70 mt-2 text-center">
          Sign in to build decks, keep a streak and track your progress.
        </ThemedText>
        <Pressable
          className="w-full mt-8 py-4 rounded-xl items-center bg-primary"
          onPress={() => router.push("/sign-in")}
        >
          <ThemedText className="text-base font-semibold text-primary-foreground">
            Sign In
          </ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1" edges={["top", "left", "right"]}>
      <ScrollView contentContainerClassName="px-5 pt-3 pb-8">
        <View className="flex-row items-center justify-between">
          <ThemedText className="text-3xl font-semibold leading-10 tracking-tight">
            Decks
          </ThemedText>
          {/* Deck creation isn't built yet. */}
          <View
            className="w-8 h-8 rounded-md border border-border bg-secondary items-center justify-center"
            accessibilityLabel="New deck"
          >
            <Ionicons name="add" size={22} color={foregroundColor} />
          </View>
        </View>

        <View className="mt-4">
          <ProgressBanner
            progress={progress.data}
            isLoading={progress.isLoading}
            onRetry={() => progress.refetch()}
          />
        </View>

        <SectionLabel>Your decks</SectionLabel>
        <View className="gap-2.5">
          {DUMMY_YOUR_DECKS.map((deck) => (
            <DeckRow key={deck.id} deck={deck} />
          ))}
        </View>

        <SectionLabel>Starter decks</SectionLabel>
        <View className="gap-2.5">
          {DUMMY_STARTER_DECKS.map((deck) => (
            <DeckRow key={deck.id} deck={deck} showCardCount />
          ))}
        </View>
      </ScrollView>
    </ThemedView>
  );
}
