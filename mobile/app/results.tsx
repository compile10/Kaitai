import { clientError } from "@common/monitoring";
import { reportMobileError } from "@/lib/monitoring";
import type { SentenceAnalysis } from "@common/types";
import { Ionicons } from "@expo/vector-icons";
import RenderHTML from "@native-html/render";
import { useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import { DependencyMap } from "@/components/dependency-map";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { buildApiUrl } from "@/constants/api";
import { useRawCSSTheme } from "@/hooks/use-raw-css-theme";
import { authFetch } from "@/lib/auth-fetch";
import { geist } from "@/lib/fonts";
import { takePickedImage, type PickedImage } from "@/lib/picked-image";

type ResultsParams = {
  sentence?: string;
  imageId?: string;
};

export default function ResultsScreen() {
  const params = useLocalSearchParams<ResultsParams>();
  return (
    <ResultsContent
      key={JSON.stringify([params.sentence, params.imageId])}
      sentence={params.sentence}
      imageId={params.imageId}
    />
  );
}

function ResultsContent({ sentence, imageId }: ResultsParams) {
  const { width } = useWindowDimensions();

  const [analysis, setAnalysis] = useState<SentenceAnalysis | null>(null);
  const [extractedSentence, setExtractedSentence] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const isImageMode = Boolean(imageId);
  const selection = useRef<{ id: string; image?: PickedImage } | undefined>(
    undefined,
  );

  const textColor = useRawCSSTheme("foreground");
  const tintColor = useRawCSSTheme("primary");

  const fetchAnalysis = useCallback(
    async (signal: AbortSignal) => {
      if (imageId) {
        if (typeof imageId !== "string")
          throw new Error(
            "Unable to access the photo. Go back and select it again.",
          );
        if (selection.current?.id !== imageId) {
          selection.current = {
            id: imageId,
            image: takePickedImage(imageId),
          };
        }
        const image = selection.current.image;
        if (!image)
          throw new Error(
            "Unable to access the photo. Go back and select it again.",
          );
        const formData = new FormData();
        formData.append("image", {
          ...image,
        } as unknown as Blob);

        const response = await authFetch(buildApiUrl("analyzeImage"), {
          method: "POST",
          body: formData,
          signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to analyze image");
        }

        return {
          sentence: data.sentence as string,
          analysis: data.analysis as SentenceAnalysis,
        };
      } else {
        if (typeof sentence !== "string" || !sentence.trim()) {
          throw new Error("No sentence to analyze. Go back and enter one.");
        }

        const response = await authFetch(buildApiUrl("analyze"), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sentence }),
          signal,
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to analyze sentence");
        }

        return { sentence, analysis: data as SentenceAnalysis };
      }
    },
    [sentence, imageId],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchAnalysis(controller.signal)
      .then((result) => {
        if (controller.signal.aborted) return;
        setExtractedSentence(result.sentence);
        setAnalysis(result.analysis);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        reportMobileError(err, clientError.mobile_analysis);
        setError(err instanceof Error ? err.message : "An error occurred");
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });
    return () => controller.abort();
  }, [fetchAnalysis, attempt]);

  if (isLoading) {
    return (
      <ThemedView className="flex-1" edges={["left", "right"]}>
        <View className="flex-1 justify-center items-center gap-4 px-6 pb-24">
          <ActivityIndicator size="large" color={tintColor} />
          <ThemedText className="opacity-70">
            {isImageMode
              ? "Reading your sentence from your photo..."
              : "Breaking down your sentence..."}
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView
        className="flex-1 justify-center pb-32"
        edges={["left", "right"]}
      >
        <View className="mx-5 p-5 rounded-xl border gap-3 bg-error-bg border-error-border">
          <View className="flex-row items-center gap-2">
            <Ionicons name="alert-circle" size={22} color={tintColor} />
            <ThemedText type="defaultSemiBold" className="text-destructive">
              Error
            </ThemedText>
          </View>
          <ThemedText className="opacity-80">{error}</ThemedText>
          <TouchableOpacity
            className="p-3 rounded-lg items-center mt-2 bg-primary"
            onPress={() => {
              setIsLoading(true);
              setError(null);
              setAttempt((value) => value + 1);
            }}
          >
            <ThemedText className="text-primary-foreground font-semibold">
              Retry
            </ThemedText>
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  }

  if (!analysis) {
    return (
      <ThemedView
        className="flex-1 items-center justify-center pb-24"
        edges={["left", "right"]}
      >
        <ThemedText className="text-muted-foreground">
          No analysis available
        </ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView className="flex-1" edges={["left", "right"]}>
      <ScrollView className="flex-1 px-5" showsVerticalScrollIndicator={false}>
        <View className="mt-2 mb-6">
          <ThemedText type="title" className="mt-1">
            {extractedSentence}
          </ThemedText>
        </View>

        <View className="mb-6 p-4 rounded-xl border bg-muted border-border">
          <ThemedText type="defaultSemiBold" className="mb-2">
            Direct Translation
          </ThemedText>
          <ThemedText className="text-base italic opacity-80">
            {analysis.directTranslation}
          </ThemedText>
        </View>

        {analysis.isFragment && (
          <View className="p-4 rounded-xl border mb-6 gap-2 bg-warning-bg border-warning-border">
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

        <View className="mb-6 p-4 rounded-xl border bg-muted border-border">
          <ThemedText type="subtitle" className="mb-3">
            Explanation
          </ThemedText>
          <RenderHTML
            contentWidth={width - 72}
            source={{ html: analysis.explanation }}
            baseStyle={{
              color: textColor,
              fontSize: 15,
              lineHeight: 22,
              fontFamily: geist.regular,
            }}
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
      className="p-4 rounded-xl border bg-muted border-border"
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
