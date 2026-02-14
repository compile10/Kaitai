"use client";

import { ImagePlus } from "lucide-react";
import { useEffect, useState } from "react";

interface SentenceInputProps {
  onAnalyze: (sentence: string) => void;
  onImageClick: () => void;
  isLoading: boolean;
  /** When set externally (e.g. from image extraction), updates the input field */
  externalSentence?: string;
}

export default function SentenceInput({
  onAnalyze,
  onImageClick,
  isLoading,
  externalSentence,
}: SentenceInputProps) {
  const [sentence, setSentence] = useState("");

  // Sync input field when an external sentence is provided (e.g. extracted from image)
  useEffect(() => {
    if (externalSentence) {
      setSentence(externalSentence);
    }
  }, [externalSentence]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (sentence.trim()) {
      onAnalyze(sentence.trim());
    }
  };

  const exampleSentences = [
    "私は美しい花を見ました。",
    "猫が静かに部屋に入った。",
    "彼女は新しい本を読んでいる。",
  ];

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="sentence"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
          >
            Enter a Japanese sentence:
          </label>
          <input
            type="text"
            id="sentence"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            className="w-full px-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            placeholder="例：私は美しい花を見ました。"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !sentence.trim()}
            className="flex-1 px-6 py-3 bg-tint text-white font-medium rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Analyzing..." : "Analyze Sentence"}
          </button>
          <button
            type="button"
            onClick={onImageClick}
            disabled={isLoading}
            className="px-4 py-3 border-2 border-tint text-tint dark:text-tintDark dark:border-tintDark font-medium rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:border-gray-400 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Analyze image"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="hidden sm:inline">Image</span>
          </button>
        </div>
      </form>

      <div className="mt-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Try these examples:
        </p>
        <div className="flex flex-wrap gap-2">
          {exampleSentences.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSentence(example)}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
