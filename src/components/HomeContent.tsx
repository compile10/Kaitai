"use client";

import { analyzeImage, analyzeSentence } from "@common/api";
import { PROVIDERS } from "@common/providers";
import type { SentenceAnalysis } from "@common/types";
import { Settings } from "lucide-react";
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
      {/* Settings Button */}
      <div className="w-full max-w-2xl flex justify-end -mt-4">
        <button
          type="button"
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          aria-label="Settings"
        >
          <Settings className="w-6 h-6" />
        </button>
      </div>

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
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-gray-600 dark:text-gray-400">
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
        <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-3 text-gray-900 dark:text-gray-100">
            How it works
          </h3>
          <ul className="space-y-2 text-gray-700 dark:text-gray-300">
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
