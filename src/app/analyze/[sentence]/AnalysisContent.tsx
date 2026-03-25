"use client";

import { analyzeSentence } from "@common/api";
import type { SentenceAnalysis } from "@common/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import SentenceVisualization from "@/components/SentenceVisualization";

export default function AnalysisContent({ sentence }: { sentence: string }) {
  const router = useRouter();
  const [analysis, setAnalysis] = useState<SentenceAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBackButton, setShowBackButton] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem("kaitai-internal-nav")) {
      setShowBackButton(true);
      sessionStorage.removeItem("kaitai-internal-nav");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function fetchAnalysis() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await analyzeSentence("/api/analyze", sentence);
        if (!cancelled) setAnalysis(data);
      } catch (err) {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchAnalysis();
    return () => {
      cancelled = true;
    };
  }, [sentence]);

  return (
    <>
      {/* Back link */}
      {showBackButton && (
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          &larr; Go back
        </button>
      )}

      {/* Sentence heading */}
      <h1 className="text-2xl font-bold text-foreground" lang="ja">
        {sentence}
      </h1>

      {/* Error */}
      {error && (
        <div className="w-full max-w-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200">
            <strong>Error:</strong> {error}
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <p className="text-muted-foreground">Analyzing sentence...</p>
        </div>
      )}

      {/* Results */}
      {analysis && !isLoading && <SentenceVisualization analysis={analysis} />}
    </>
  );
}
