"use client";

import { analyzeImage } from "@common/api";
import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageUploadModal from "@/components/ImageUploadModal";
import SentenceInput from "@/components/SentenceInput";

export default function HomeContent() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);

  const handleAnalyze = (sentence: string) => {
    router.push(`/analyze/${encodeURIComponent(sentence)}`);
  };

  const handleImageAnalyze = async (file: File) => {
    setIsImageLoading(true);
    setError(null);

    try {
      const data = await analyzeImage("/api/analyze-image", file);
      setIsImageModalOpen(false);
      router.push(`/analyze/${encodeURIComponent(data.sentence)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to analyze image");
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
        isLoading={isImageLoading}
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
      {isImageLoading && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-muted-foreground">Extracting text from image...</p>
        </div>
      )}

      {/* Instructions */}
      {!isImageLoading && !error && (
        <div className="w-full max-w-2xl bg-card p-6 shadow-lg">
          <h3 className="text-lg font-semibold mb-3 text-card-foreground">
            How it works
          </h3>
          <ul className="space-y-2 text-card-foreground/70">
            <li className="flex items-start">
              <span className="mr-2">1.</span>
              <span>Enter a Japanese sentence in the input field above</span>
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
