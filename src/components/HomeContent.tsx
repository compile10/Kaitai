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
    sessionStorage.setItem("kaitai-internal-nav", "1");
    router.push(`/analyze/${encodeURIComponent(sentence)}`);
  };

  const handleImageAnalyze = async (file: File) => {
    setIsImageLoading(true);
    setError(null);

    try {
      const data = await analyzeImage("/api/analyze-image", file);
      setIsImageModalOpen(false);
      sessionStorage.setItem("kaitai-internal-nav", "1");
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
          <div className="space-y-3 text-card-foreground/70">
            <p>
              The best way to learn Japanese is through exposure to real Japanese
              sentences but unfamiliar words and grammar can make them hard to
              understand.
            </p>
            <p>
              Kaitai uses AI to break down any sentence into its components,
              explaining grammar points, sentence structure, and word meanings so
              you learn beyond normal speed.
            </p>
          </div>
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
