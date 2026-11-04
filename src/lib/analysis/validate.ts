import type { SentenceAnalysis } from "@common/types";

// ・ may join a single foreign name (トム・クルーズ), so it is allowed inside words.
const PUNCTUATION = /[^\P{P}・]|\p{S}/u;
const ONLY_PUNCTUATION = /^[\p{P}\p{S}]+$/u;

/** Ignore spacing and width differences (e.g. OCR full-width spaces, ？ vs ?). */
function normalize(text: string): string {
  return text.normalize("NFKC").replace(/\s/gu, "");
}

/** Rebuilds the sentence from nodes in position order, including attached particles. */
export function rebuildSentence(analysis: SentenceAnalysis): string {
  return [...analysis.words]
    .sort((a, b) => a.position - b.position)
    .map((word) => word.text + (word.attachedParticle?.text ?? ""))
    .join("");
}

/**
 * Checks that the nodes reproduce the input sentence exactly, punctuation
 * included, and form a valid graph. Returns human-readable errors for the
 * model; empty when valid.
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
        "Joining every entry's text and attachedParticle in position order does not reproduce the sentence (ignoring spaces).",
        `Expected: ${expected}`,
        `Rebuilt:  ${rebuilt}`,
        `First difference at character ${index}: expected "${expected.slice(index, index + 5)}", got "${rebuilt.slice(index, index + 5)}".`,
        "Each character must appear exactly once, copied as written, with no kana/kanji conversion, no particle repeated inside the next word, and every punctuation mark as its own punctuation entry.",
      ].join("\n"),
    );
  }

  const ids = new Set<string>();
  const punctuationIds = new Set<string>();
  for (const word of analysis.words) {
    if (ids.has(word.id)) errors.push(`Duplicate word id "${word.id}".`);
    ids.add(word.id);
    if (word.kind === "punctuation") {
      punctuationIds.add(word.id);
      if (!ONLY_PUNCTUATION.test(normalize(word.text))) {
        errors.push(
          `Entry "${word.id}" (${word.text}) has kind "punctuation" but contains non-punctuation characters.`,
        );
      }
      if (word.attachedParticle || (word.modifies?.length ?? 0) > 0) {
        errors.push(
          `Punctuation entry "${word.id}" (${word.text}) must have attachedParticle null and an empty modifies array.`,
        );
      }
    } else if (PUNCTUATION.test(word.text)) {
      errors.push(
        `Word "${word.id}" (${word.text}) contains punctuation. Split each mark into its own entry with kind "punctuation".`,
      );
    }
  }
  for (const word of analysis.words) {
    for (const target of word.modifies ?? []) {
      if (target === word.id) {
        errors.push(`Word "${word.id}" (${word.text}) modifies itself.`);
      } else if (!ids.has(target)) {
        errors.push(
          `Word "${word.id}" (${word.text}) modifies "${target}", which is not the id of any word.`,
        );
      } else if (punctuationIds.has(target)) {
        errors.push(
          `Word "${word.id}" (${word.text}) modifies punctuation entry "${target}". Words only modify other words.`,
        );
      }
    }
  }

  return errors;
}
