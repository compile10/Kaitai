"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import SentenceInput from "@/components/SentenceInput";
import SentenceVisualization from "@/components/SentenceVisualization";
import SettingsModal from "@/components/SettingsModal";
import { useSettings } from "@/hooks/useSettings";
import type { SentenceAnalysis } from "@/types/analysis";

export default function Home() {
  const [analysis, setAnalysis] = useState<SentenceAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { selectedModel, updateModel, isLoaded, models } = useSettings();

  const handleAnalyze = async (sentence: string) => {
    setIsLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sentence, model: selectedModel }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to analyze sentence");
      }

      const data = await response.json();
      console.log("Analysis received:", JSON.stringify(data, null, 2));
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center space-y-8">
          {/* Header */}
          <div className="text-center space-y-2 relative w-full max-w-2xl">
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="absolute right-0 top-0 p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-6 h-6" />
            </button>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
              日本語 Sentence Analyzer
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Visualize Japanese sentence structure with AI-powered analysis
            </p>
          </div>

          {/* Input Form */}
          <SentenceInput onAnalyze={handleAnalyze} isLoading={isLoading} />

          {/* Error Message */}
          {error && (
            <div className="w-full max-w-2xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200">
                <strong>Error:</strong> {error}
              </p>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="text-gray-600 dark:text-gray-400">
                Analyzing with Claude...
              </p>
            </div>
          )}

          {/* Analysis Results */}
          {analysis && !isLoading && (
            <SentenceVisualization analysis={analysis} />
          )}

          {/* Instructions */}
          {!analysis && !isLoading && !error && (
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
                    Click "Analyze Sentence" to send it to Claude AI for
                    analysis
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
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-gray-600 dark:text-gray-400 text-sm">
        <p>Powered by Claude AI and Next.js</p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentModel={selectedModel}
        models={models}
        onSave={updateModel}
      />
    </div>
  );
}
