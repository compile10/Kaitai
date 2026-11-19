import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { ThemedText } from "@/components/themed-text";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useRawCSSTheme } from "@/hooks/use-raw-css-theme";
import type { DeckSummary } from "@/lib/dummy-decks";
import { DeckBannerBackground } from "./deck-banner-background";

const CHIP_COLORS = {
  light: {
    ready: { backgroundColor: "#fee2e2", color: "#b91c1c" },
    new: { backgroundColor: "#dbeafe", color: "#1d4ed8" },
    training: { backgroundColor: "#ffedd5", color: "#c2410c" },
  },
  dark: {
    ready: { backgroundColor: "rgba(248, 113, 113, 0.18)", color: "#fca5a5" },
    new: { backgroundColor: "rgba(96, 165, 250, 0.18)", color: "#93c5fd" },
    training: { backgroundColor: "rgba(251, 146, 60, 0.18)", color: "#fdba74" },
  },
} as const;

// The deck row sits on `secondary`, which matches `border` in dark mode, so
// tracks and the idle play button use a translucent stone that shows on both.
const SUBTLE_FILL = "rgba(120, 113, 108, 0.4)";

function Chip({
  label,
  kind,
}: {
  label: string;
  kind: keyof (typeof CHIP_COLORS)["light"];
}) {
  const scheme = useColorScheme() === "dark" ? "dark" : "light";
  const { backgroundColor, color } = CHIP_COLORS[scheme][kind];
  return (
    <View className="rounded-full px-2 py-0.5" style={{ backgroundColor }}>
      <ThemedText className="text-xs font-semibold leading-4" style={{ color }}>
        {label}
      </ThemedText>
    </View>
  );
}

/** One deck in the Decks tab: due counts and a play button, or + Add. */
export function DeckRow({
  deck,
  showCardCount = false,
}: {
  deck: DeckSummary;
  showCardCount?: boolean;
}) {
  const mutedColor = useRawCSSTheme("muted-foreground");
  const { counts } = deck;
  const hasDue = !!counts && counts.ready + counts.new + counts.training > 0;

  return (
    <View className="bg-secondary border border-border rounded-2xl overflow-hidden py-3.5 pl-4 pr-3.5 flex-row items-center gap-3">
      {deck.banner && (
        <DeckBannerBackground banner={deck.banner} gradientId={deck.id} />
      )}
      <View className="flex-1">
        <View className="flex-row items-baseline gap-2">
          <ThemedText className="text-[17px] font-semibold leading-6">
            {deck.name}
          </ThemedText>
          {showCardCount && (
            <ThemedText className="text-xs text-muted-foreground">
              {deck.cardCount.toLocaleString()} cards
            </ThemedText>
          )}
        </View>

        {counts === null ? (
          deck.description && (
            <ThemedText className="text-[13px] text-muted-foreground mt-1 leading-5">
              {deck.description}
            </ThemedText>
          )
        ) : hasDue ? (
          <View className="flex-row flex-wrap gap-1.5 mt-2">
            {counts.ready > 0 && (
              <Chip label={`${counts.ready} Ready`} kind="ready" />
            )}
            {counts.new > 0 && <Chip label={`${counts.new} New`} kind="new" />}
            {counts.training > 0 && (
              <Chip label={`${counts.training} Training`} kind="training" />
            )}
          </View>
        ) : (
          <View className="flex-row items-center gap-1.5 mt-2">
            <View className="rounded-full px-2 py-0.5 border border-border bg-background">
              <ThemedText className="text-xs font-semibold leading-4 text-muted-foreground">
                All clear ✓
              </ThemedText>
            </View>
            {deck.nextDueLabel && (
              <ThemedText className="text-xs text-muted-foreground">
                {deck.nextDueLabel}
              </ThemedText>
            )}
          </View>
        )}

        {counts !== null && deck.masteredPercent !== undefined && (
          // Label first: it stays over the faded left of the banner photo.
          <View className="flex-row items-center gap-2 mt-2.5">
            <ThemedText className="text-xs text-muted-foreground">
              {deck.masteredPercent}% mastered
            </ThemedText>
            <View
              className="flex-1 h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: SUBTLE_FILL }}
            >
              <View
                className="h-full rounded-full bg-primary"
                style={{ width: `${deck.masteredPercent}%` }}
              />
            </View>
          </View>
        )}
      </View>

      {counts === null ? (
        <View className="rounded-full border-[1.5px] border-primary bg-secondary px-3.5 py-1.5">
          <ThemedText className="text-sm font-semibold text-primary">
            + Add
          </ThemedText>
        </View>
      ) : (
        <View
          className={`w-11 h-11 rounded-full items-center justify-center ${
            hasDue ? "bg-primary" : "bg-secondary border border-border"
          }`}
        >
          <Ionicons
            name="play"
            size={20}
            color={hasDue ? "#ffffff" : mutedColor}
            style={{ marginLeft: 2 }}
          />
        </View>
      )}
    </View>
  );
}
