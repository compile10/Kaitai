import { isPunctuationNode, type SentenceAnalysis } from "@common/types";

// ・ may join a single foreign name (トム・クルーズ), so it is allowed inside words.
const PUNCTUATION = /[^\P{P}・]|\p{S}/u;
const ONLY_PUNCTUATION = /^[\p{P}\p{S}]+$/u;
// Number expressions keep their symbols and separators (¥500, 1,000, 10:30,
// 50%, 25°C, −5°C, 10〜20), checked after NFKC normalization.
const NUMBER = String.raw`[-+−]?\p{Sc}?\d+(?:[.,:]\d+)*[%°]?`;
const NUMBER_EXPRESSION = new RegExp(`${NUMBER}(?:[〜~–—-]${NUMBER})*`, "gu");

/** Ignore spacing and width differences (e.g. OCR full-width spaces, ？ vs ?). */
function normalize(text: string): string {
  return text.normalize("NFKC").replace(/\s/gu, "");
}

/** Rebuilds the sentence from nodes in position order, including attached particles. */
export function rebuildSentence(analysis: SentenceAnalysis): string {
  return [...analysis.nodes]
    .sort((a, b) => a.position - b.position)
    .map((node) =>
      isPunctuationNode(node)
        ? node.text
        : node.text + (node.attachedParticle?.text ?? ""),
    )
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
        "Joining every node's text (and each word's attachedParticle) in position order does not reproduce the sentence (ignoring spaces).",
        `Expected: ${expected}`,
        `Rebuilt:  ${rebuilt}`,
        `First difference at character ${index}: expected "${expected.slice(index, index + 5)}", got "${rebuilt.slice(index, index + 5)}".`,
        "Each character must appear exactly once, copied as written, with no kana/kanji conversion, no particle repeated inside the next word, and every punctuation mark as its own punctuation node.",
      ].join("\n"),
    );
  }

  const ids = new Set<string>();
  const punctuationIds = new Set<string>();
  for (const node of analysis.nodes) {
    if (ids.has(node.id)) errors.push(`Duplicate node id "${node.id}".`);
    ids.add(node.id);
    if (isPunctuationNode(node)) {
      punctuationIds.add(node.id);
      if (!ONLY_PUNCTUATION.test(normalize(node.text))) {
        errors.push(
          `Punctuation node "${node.id}" (${node.text}) contains non-punctuation characters. Use a word node instead.`,
        );
      }
    } else if (
      PUNCTUATION.test(normalize(node.text).replace(NUMBER_EXPRESSION, ""))
    ) {
      errors.push(
        `Word "${node.id}" (${node.text}) contains punctuation. Split each mark into its own punctuation node.`,
      );
    }
  }
  for (const node of analysis.nodes) {
    if (isPunctuationNode(node)) continue;
    for (const target of node.modifies ?? []) {
      if (target === node.id) {
        errors.push(`Word "${node.id}" (${node.text}) modifies itself.`);
      } else if (!ids.has(target)) {
        errors.push(
          `Word "${node.id}" (${node.text}) modifies "${target}", which is not the id of any node.`,
        );
      } else if (punctuationIds.has(target)) {
        errors.push(
          `Word "${node.id}" (${node.text}) modifies punctuation node "${target}". Words only modify other words.`,
        );
      }
    }
  }

  return errors;
}
