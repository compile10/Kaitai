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
import type { SentenceAnalysis } from "@common/types";
import { buildApiUrl } from "@/constants/api";
import { useSettingsStore, PROVIDER_MAP } from "@/stores/settings-store";

export default function ResultsScreen() {
  const { sentence, imageUri, imageMimeType, imageFileName } =
    useLocalSearchParams<{
      sentence?: string;
      imageUri?: string;
      imageMimeType?: string;
      imageFileName?: string;
    }>();
  const { width } = useWindowDimensions();

  const { provider, model, isHydrated } = useSettingsStore();

  const [analysis, setAnalysis] = useState<SentenceAnalysis | null>(null);
  const [extractedSentence, setExtractedSentence] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isImageMode = Boolean(imageUri);

  const textColor = useThemeColor({}, "text");
  const tintColor = useThemeColor({}, "tint");

  const fetchAnalysis = useCallback(async () => {
    if (!isHydrated) return;
    if (!imageUri && !sentence) return;

    setIsLoading(true);
    setError(null);
    setAnalysis(null);
    setExtractedSentence(null);

    try {
      if (imageUri) {
        const formData = new FormData();
        formData.append("image", {
          uri: imageUri,
          type: imageMimeType || "image/jpeg",
          name: imageFileName || "image.jpg",
        } as unknown as Blob);
        formData.append("provider", provider);
        formData.append("model", model);

        const response = await fetch(buildApiUrl("analyzeImage"), {
          method: "POST",
          body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to analyze image");
        }

        setExtractedSentence(data.sentence);
        setAnalysis(data.analysis);
      } else {
        setExtractedSentence(sentence || null);
        const result = await analyzeSentence(
          buildApiUrl("analyze"),
          sentence!,
          provider,
          model,
        );
        setAnalysis(result);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, [sentence, imageUri, imageMimeType, imageFileName, provider, model, isHydrated]);

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
            {isImageMode
              ? "Reading your sentence from your photo..."
              : `Breaking down your sentence...`}
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

  return (
    <ThemedView className="flex-1">
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mt-2 mb-6">
          <ThemedText type="title" className="mt-1">
            {extractedSentence}
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
            Grammar Points
          </ThemedText>
          <View className="gap-2">
            {analysis.grammarPoints.map((point, index) => (
              <GrammarPointItem
                key={`${point.title}-${index}`}
                grammarPoint={point}
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

interface GrammarPointItemProps {
  grammarPoint: { title: string; explanation: string };
  tintColor: string;
}

function GrammarPointItem({ grammarPoint, tintColor }: GrammarPointItemProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <TouchableOpacity
      className="p-4 rounded-xl border bg-card dark:bg-cardDark border-muted dark:border-mutedDark"
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View className="flex-row items-center justify-between gap-3">
        <ThemedText type="defaultSemiBold" className="flex-1">
          {grammarPoint.title}
        </ThemedText>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={20}
          color={tintColor}
        />
      </View>

      {expanded && (
        <ThemedText className="text-sm opacity-80 leading-5 mt-3">
          {grammarPoint.explanation}
        </ThemedText>
      )}
    </TouchableOpacity>
  );
}
