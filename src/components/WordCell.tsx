"use client";

import type { WordNode } from "@common/types";
import { useState } from "react";
import { useSettingsQuery } from "@/hooks/use-settings-query";

export default function WordCell({ word }: { word: WordNode }) {
  const { data: settings } = useSettingsQuery();
  const showTranslation = settings?.showWordTranslations ?? false;

  return (
    <div
      className={`border-2 rounded-lg px-3 py-2 shadow-md hover:shadow-lg transition-shadow ${word.isTopic ? "bg-topic-bg border-topic-border" : "bg-card border-border"}`}
      style={{ minWidth: "120px", maxWidth: "150px" }}
    >
      <span className="block text-xl font-bold text-foreground mb-0.5 leading-snug text-center">
        {word.text}
      </span>
      {word.reading && (
        <span className="block text-sm text-muted-foreground mb-1 leading-snug text-center">
          {word.reading}
        </span>
      )}
      <span className="block text-xs text-primary font-medium leading-snug text-center">
        {word.partOfSpeech}
      </span>
      {word.translation && (
        <WordTranslation
          key={`${word.id}:${word.translation}:${showTranslation}`}
          word={word}
          showTranslation={showTranslation}
        />
      )}
    </div>
  );
}

function WordTranslation({
  word,
  showTranslation,
}: {
  word: WordNode;
  showTranslation: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const className =
    "mt-1 block w-full py-1 text-sm leading-snug text-foreground text-center break-words";
  if (showTranslation) {
    return <span className={className}>{word.translation}</span>;
  }
  return (
    <button
      type="button"
      aria-label={
        revealed
          ? `${word.translation}. Hide English meaning of ${word.text}`
          : `Reveal English meaning of ${word.text}`
      }
      title={revealed ? "Hide translation" : "Reveal translation"}
      className={`${className} nodrag nopan cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-primary`}
      onClick={(event) => {
        event.stopPropagation();
        setRevealed((value) => !value);
      }}
    >
      <span
        className={`block ${revealed ? "" : "select-none blur-[5px]"}`}
        aria-hidden={!revealed}
        aria-live={revealed ? "polite" : undefined}
      >
        {word.translation}
      </span>
    </button>
  );
}
