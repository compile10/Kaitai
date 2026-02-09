import { useEffect, useState, useCallback } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import RenderHTML from "@native-html/render";

import { DependencyMap } from "@/components/dependency-map";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useThemeColor } from "@/hooks/use-theme-color";
import { analyzeSentence } from "@common/api";
import type { SentenceAnalysis, WordNode } from "@common/types";
import { buildApiUrl } from "@/constants/api";
import { useSettingsStore, PROVIDER_MAP } from "@/stores/settings-store";

export default function ResultsScreen() {
  const { sentence } = useLocalSearchParams<{ sentence: string }>();
  const { width } = useWindowDimensions();

  const { provider, model, isHydrated } = useSettingsStore();

  const [analysis, setAnalysis] = useState<SentenceAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");

  const fetchAnalysis = useCallback(async () => {
    if (!sentence || !isHydrated) return;
    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeSentence(
        buildApiUrl("analyze"),
        sentence,
        provider,
        model,
      );
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [sentence, provider, model, isHydrated]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  const currentProvider = PROVIDER_MAP[provider];
  const currentModel = currentProvider?.models.find((m) => m.id === model);

  if (isLoading || !isHydrated) {
    return (
      <ThemedView className="flex-1">
        <View className="flex-1 justify-center items-center gap-4">
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText className="opacity-70">
            Analyzing with {currentModel?.name || model}...
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView className="flex-1 justify-center pb-32">
        <View className="mx-5 p-5 rounded-xl border gap-3 bg-errorBg dark:bg-errorBgDark border-errorBorder dark:border-errorBorderDark">
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={22} color="#dc2626" />
            <ThemedText type="defaultSemiBold" className="text-red-600">
              Error
            </ThemedText>
          </View>
          <ThemedText className="opacity-80">{error}</ThemedText>
          <TouchableOpacity
            className="p-3 rounded-lg items-center mt-2 bg-tint dark:bg-tintDark"
            onPress={fetchAnalysis}
          >
            <ThemedText className="text-white font-semibold">Retry</ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (!analysis) {
    return (
      <ThemedView className="flex-1">
        <ThemedText>No analysis available</ThemedText>
      </ThemedView>
    );
  }

  const allWordsSorted = [...analysis.words].sort(
    (a, b) => a.position - b.position,
  );

  return (
    <ThemedView className="flex-1">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mt-2 mb-6">
          <ThemedText type="title" className="mt-2">
            {sentence?.trim() || ""}
          </ThemedText>
        </View>

        <View className="mb-6 p-4 rounded-xl border bg-card dark:bg-cardDark border-muted dark:border-mutedDark">
          <ThemedText type="defaultSemiBold" className="mb-2">
            Direct Translation
          </ThemedText>
          <ThemedText className="text-base italic opacity-80">
            {analysis.directTranslation}
          </ThemedText>
        </View>

        {analysis.isFragment && (
          <View className="p-4 rounded-xl border mb-6 gap-2 bg-warningBg dark:bg-warningBgDark border-warningBorder dark:border-warningBorderDark">
            <ThemedText type="defaultSemiBold" className="text-yellow-600">
              Sentence Fragment
            </ThemedText>
            <ThemedText className="text-sm opacity-80">
              This appears to be an incomplete sentence or fragment. It may be
              missing key components.
            </ThemedText>
          </View>
        )}

        <View className="mb-6">
          <ThemedText type="subtitle" className="mb-3">
            Sentence Structure
          </ThemedText>
          <DependencyMap words={analysis.words} />
        </View>

        <View className="mb-6 p-4 rounded-xl border bg-card dark:bg-cardDark border-muted dark:border-mutedDark">
          <ThemedText type="subtitle" className="mb-3">
            Explanation
          </ThemedText>
          <RenderHTML
            contentWidth={width - 72}
            source={{ html: analysis.explanation }}
            baseStyle={{ color: textColor, fontSize: 15, lineHeight: 22 }}
            tagsStyles={{
              p: { marginBottom: 12 },
              strong: { fontWeight: "700" },
              ul: { marginLeft: 16 },
              li: { marginBottom: 4 },
            }}
          />
        </View>

        <View className="mb-6">
          <ThemedText type="subtitle" className="mb-3">
            Word Details
          </ThemedText>
          <View className="gap-2">
            {allWordsSorted.map((word) => (
              <WordDetailItem
                key={word.id}
                word={word}
                allWords={analysis.words}
                tintColor={tintColor}
              />
            ))}
          </View>
        </View>

        <View className="h-10" />
      </ScrollView>
    </ThemedView>
  );
}

interface WordDetailItemProps {
  word: WordNode;
  allWords: WordNode[];
  tintColor: string;
}

function WordDetailItem({ word, allWords, tintColor }: WordDetailItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      className="p-4 rounded-xl border bg-card dark:bg-cardDark border-muted dark:border-mutedDark"
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center flex-wrap gap-2">
        {word.isTopic && (
          <View className="bg-violet-600 px-1.5 py-0.5 rounded">
            <ThemedText className="text-white text-[10px] font-bold">
              TOPIC
            </ThemedText>
          </View>
        )}
        <ThemedText type="defaultSemiBold">{word.text}</ThemedText>
        {word.attachedParticle && (
          <ThemedText className="font-semibold text-orange-500">
            {word.attachedParticle.text}
          </ThemedText>
        )}
        {word.reading && (
          <ThemedText className="text-sm opacity-60">
            ({word.reading})
          </ThemedText>
        )}
        <ThemedText className="text-sm text-blue-500">
          {word.partOfSpeech}
        </ThemedText>
      </View>

      {word.modifies && word.modifies.length > 0 && (
        <ThemedText className="text-[13px] opacity-70 mt-2">
          Modifies:{" "}
          {word.modifies
            .map((id) => allWords.find((w) => w.id === id)?.text || id)
            .join(", ")}
        </ThemedText>
      )}

      {expanded && word.attachedParticle && (
        <View className="mt-3 pt-3 border-t border-muted dark:border-mutedDark">
          <ThemedText className="font-semibold mb-1">
            Particle 「{word.attachedParticle.text}」:
          </ThemedText>
          <ThemedText className="text-sm opacity-80 leading-5">
            {word.attachedParticle.description}
          </ThemedText>
        </View>
      )}

      {word.attachedParticle && (
        <ThemedText className="text-xs mt-2" style={{ color: tintColor }}>
          {expanded ? "Tap to collapse" : "Tap for particle details"}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}
