import type { SentenceAnalysis } from "@common/types";

/** Ignore spacing, punctuation, and width differences (e.g. OCR full-width spaces). */
function normalize(text: string): string {
  return text.normalize("NFKC").replace(/[\s\p{P}]/gu, "");
}

/** Rebuilds the sentence from words in position order, including attached particles. */
export function rebuildSentence(analysis: SentenceAnalysis): string {
  return [...analysis.words]
    .sort((a, b) => a.position - b.position)
    .map((word) => word.text + (word.attachedParticle?.text ?? ""))
    .join("");
}

/**
 * Checks that the word nodes reproduce the input sentence exactly and form a
 * valid graph. Returns human-readable errors for the model; empty when valid.
 */
export function validateAnalysis(
  sentence: string,
  analysis: SentenceAnalysis,
): string[] {
  const errors: string[] = [];

  const expected = normalize(sentence);
  const rebuilt = normalize(rebuildSentence(analysis));
  if (rebuilt !== expected) {
    let index = 0;
    while (index < expected.length && expected[index] === rebuilt[index]) {
      index++;
    }
    errors.push(
      [
        "Joining every word's text and attachedParticle in position order does not reproduce the sentence (ignoring spaces and punctuation).",
        `Expected: ${expected}`,
        `Rebuilt:  ${rebuilt}`,
        `First difference at character ${index}: expected "${expected.slice(index, index + 5)}", got "${rebuilt.slice(index, index + 5)}".`,
        "Each character must appear exactly once, copied as written, with no kana/kanji conversion and no particle repeated inside the next word.",
      ].join("\n"),
    );
  }

  const ids = new Set<string>();
  for (const word of analysis.words) {
    if (ids.has(word.id)) errors.push(`Duplicate word id "${word.id}".`);
    ids.add(word.id);
  }
  for (const word of analysis.words) {
    for (const target of word.modifies ?? []) {
      if (target === word.id) {
        errors.push(`Word "${word.id}" (${word.text}) modifies itself.`);
      } else if (!ids.has(target)) {
        errors.push(
          `Word "${word.id}" (${word.text}) modifies "${target}", which is not the id of any word.`,
        );
      }
    }
  }

  return errors;
}
