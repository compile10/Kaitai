"use client";

import { analyzeImage, analyzeSentence } from "@common/api";
import { PROVIDERS } from "@common/providers";
import type { SentenceAnalysis } from "@common/types";
import { useState } from "react";
import ImageUploadModal from "@/components/ImageUploadModal";
import SentenceInput from "@/components/SentenceInput";
import SentenceVisualization from "@/components/SentenceVisualization";
import SettingsModal from "@/components/SettingsModal";
import { useSettingsStore } from "@/providers/settings-store-provider";

export default function HomeContent() {
  const [analysis, setAnalysis] = useState<SentenceAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [extractedSentence, setExtractedSentence] = useState<string>();
  const provider = useSettingsStore((s) => s.provider);
  const model = useSettingsStore((s) => s.model);

  const currentProvider = PROVIDERS.find((p) => p.id === provider);

  const handleAnalyze = async (sentence: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const data = await analyzeSentence(
        "/api/analyze",
        sentence,
        provider,
        model,
      );
      console.log("Analysis received:", JSON.stringify(data, null, 2));
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageAnalyze = async (file: File) => {
    setIsImageLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const data = await analyzeImage(
        "/api/analyze-image",
        file,
        provider,
        model,
      );
      console.log("Image analysis received:", JSON.stringify(data, null, 2));
      setAnalysis(data.analysis);
      setExtractedSentence(data.sentence);
      setIsImageModalOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze image",
      );
    } finally {
      setIsImageLoading(false);
    }
  };

  return (
    <>
      {/* Input Form */}
      <SentenceInput
        onAnalyze={handleAnalyze}
        onImageClick={() => setIsImageModalOpen(true)}
        isLoading={isLoading || isImageLoading}
        externalSentence={extractedSentence}
      />

      {/* Error Message */}
      {error && (
        <div className="w-full max-w-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Loading State */}
      {(isLoading || isImageLoading) && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-muted-foreground">
            {isImageLoading
              ? "Extracting text from image and analyzing..."
              : `Analyzing with ${currentProvider?.models.find((m) => m.id === model)?.name || model}...`}
          </p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !isLoading && !isImageLoading && (
        <SentenceVisualization analysis={analysis} />
      )}

      {/* Instructions */}
      {!analysis && !isLoading && !isImageLoading && !error && (
        <div className="w-full max-w-2xl bg-card-alt p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-3 text-card-alt-foreground">
            How it works
          </h3>
          <ul className="space-y-2 text-card-alt-foreground/70">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>
                Enter a Japanese sentence in the input field above
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">2.</span>
              <span>
                Click &quot;Analyze Sentence&quot; to send it to AI for analysis
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">3.</span>
              <span>
                View the visual representation showing how words modify each
                other
              </span>
            </li>
            <li className="flex items-start">
              <span className="mr-2">4.</span>
              <span>
                Read the detailed explanation of the sentence structure
              </span>
            </li>
          </ul>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Image Upload Modal */}
      <ImageUploadModal
        isOpen={isImageModalOpen}
        onClose={() => !isImageLoading && setIsImageModalOpen(false)}
        onSubmit={handleImageAnalyze}
        isLoading={isImageLoading}
      />
    </>
  );
}
