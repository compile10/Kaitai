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
    <div className="w-full max-w-2xl bg-card text-card-foreground p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="sentence"
            className="block text-sm font-medium text-card-foreground/70 mb-2"
          >
            Enter a Japanese sentence:
          </label>
          <input
            type="text"
            id="sentence"
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            className="w-full px-4 py-3 text-lg border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent bg-background text-foreground"
            placeholder="例：私は美しい花を見ました。"
            disabled={isLoading}
          />
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isLoading || !sentence.trim()}
            className="flex-1 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Analyzing..." : "Analyze Sentence"}
          </button>
          <button
            type="button"
            onClick={onImageClick}
            disabled={isLoading}
            className="px-4 py-3 border-2 border-primary text-primary font-medium rounded-lg hover:bg-primary/10 disabled:border-muted-foreground disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            title="Analyze image"
          >
            <ImagePlus className="w-5 h-5" />
            <span className="hidden sm:inline">Image</span>
          </button>
        </div>
      </form>

      <div className="mt-6">
        <p className="text-sm text-card-foreground/70 mb-2">
          Try these examples:
        </p>
        <div className="flex flex-wrap gap-2">
          {exampleSentences.map((example, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setSentence(example)}
              disabled={isLoading}
              className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
