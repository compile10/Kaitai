import type { AccountProgress } from "@common/types";
import { ActivityIndicator, Pressable, View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { StreakFlame } from "./streak-flame";

const CARD_FOREGROUND = "#fecaca";
// Soft dark-red glow under the flashcard panel, as in the mockups.
const PANEL_SHADOW = { boxShadow: "0 18px 40px rgba(74, 12, 12, 0.35)" };

interface ProgressBannerProps {
  progress: AccountProgress | undefined;
  isLoading: boolean;
  onRetry: () => void;
}

/** Day streak, XP and today's quest on the dark-red flashcard panel. */
export function ProgressBanner({
  progress,
  isLoading,
  onRetry,
}: ProgressBannerProps) {
  if (!progress) {
    return (
      <View
        className="bg-card rounded-2xl px-5 py-6 items-center justify-center min-h-[112px]"
        style={PANEL_SHADOW}
      >
        {isLoading ? (
          <ActivityIndicator color={CARD_FOREGROUND} />
        ) : (
          <Pressable onPress={onRetry} className="items-center">
            <ThemedText className="text-card-foreground text-sm">
              Couldn&apos;t load your progress.
            </ThemedText>
            <ThemedText className="text-white text-sm font-semibold mt-1">
              Tap to retry
            </ThemedText>
          </Pressable>
        )}
      </View>
    );
  }

  const { currentStreak, xp, dailyQuest } = progress;
  const questShare = Math.min(dailyQuest.progress / dailyQuest.target, 1);

  return (
    <View className="bg-card rounded-2xl px-[18px] py-4" style={PANEL_SHADOW}>
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          <StreakFlame />
          <View>
            <ThemedText className="text-white text-xl font-bold leading-6">
              {currentStreak} {currentStreak === 1 ? "day" : "days"}
            </ThemedText>
            <ThemedText className="text-card-foreground text-xs opacity-80 leading-4">
              streak
            </ThemedText>
          </View>
        </View>
        <View className="items-end">
          <ThemedText
            className="text-white text-xl font-bold leading-6"
            style={{ fontVariant: ["tabular-nums"] }}
          >
            {xp.toLocaleString()}
          </ThemedText>
          <ThemedText className="text-card-foreground text-xs opacity-80 leading-4">
            XP
          </ThemedText>
        </View>
      </View>

      <View className="flex-row items-center justify-between mt-3.5">
        <ThemedText className="font-geist-bold text-card-foreground text-[13px] leading-5">
          Daily Quest: Clear {dailyQuest.target} cards
        </ThemedText>
        <ThemedText
          className="text-white text-[13px] leading-5"
          style={{ fontVariant: ["tabular-nums"] }}
        >
          {dailyQuest.progress}/{dailyQuest.target}
        </ThemedText>
      </View>
      <View
        className="h-2 rounded-full overflow-hidden mt-1.5"
        style={{ backgroundColor: "rgba(254, 202, 202, 0.2)" }}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: dailyQuest.target,
          now: Math.min(dailyQuest.progress, dailyQuest.target),
        }}
      >
        <View
          className="h-full rounded-full"
          style={{ width: `${questShare * 100}%`, backgroundColor: "#f97316" }}
        />
      </View>
    </View>
  );
}
