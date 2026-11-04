import type { SentenceAnalysis } from "@common/types";
import {
  AIMessage,
  type BaseMessage,
  HumanMessage,
} from "@langchain/core/messages";
import sanitizeHtml from "sanitize-html";
import { log } from "@/lib/monitoring/logger";
import { createChatModel } from "./client";
import { analysisSchema } from "./schema";
import { validateAnalysis } from "./validate";

/** Correction rounds after the first answer fails validation. */
const MAX_REPAIR_ATTEMPTS = 2;

const ANALYSIS_PROMPT = `Analyze the following Japanese sentence and break it down into its constituent words and phrases. For each word/phrase, identify what it modifies or relates to in the sentence. This will be used to create a visual diagram showing the grammatical relationships.

Sentence: {{SENTENCE}}

First, determine whether this is a COMPLETE SENTENCE or a SENTENCE FRAGMENT:
- A complete sentence has a predicate (verb, adjective, or copula) and expresses a complete thought
- A fragment is missing key components (e.g., just a noun phrase, incomplete clause, etc.)
- Set "isFragment: true" if it's a fragment, "isFragment: false" if it's complete

IMPORTANT RULES:
1. Particles (は, を, に, が, の, etc.) should be ATTACHED to their corresponding words using the "attachedParticle" field. Do NOT create separate word entries for particles.
   Example: "私は" → { text: "私", attachedParticle: { text: "は", description: "Marks '私' as the topic of the sentence" } }

2. For EACH particle, provide a brief description (1-2 sentences) explaining its function in THIS specific sentence. Be contextual and practical.
   Examples:
   - は: "Marks the topic - what the sentence is about"
   - を: "Marks the direct object of the verb"
   - に: "Indicates the destination/direction of movement"

3. The TOPIC (marked with は or も) should be identified with "isTopic: true". Topics provide context but DO NOT modify other words in the sentence. Topics should have an EMPTY "modifies" array.
   Example: "私は" (I) is the topic → { text: "私", attachedParticle: { text: "は", description: "..." }, isTopic: true, modifies: [] }

4. For modification relationships:
   - Adjectives modify nouns
   - Adverbs modify verbs/adjectives
   - Objects (を) modify verbs
   - Topics (は) do NOT modify anything - they provide context only
   - Subjects (が) modify the verb or an adjective they are attached to

5. Copy each word's "text" exactly as it is written in the sentence. Do NOT convert kana to kanji or kanji to kana, and do not include punctuation (。、？！) in any word.

6. WORD BOUNDARIES: Each word entry is ONE content word (noun, verb, adjective, adverb) plus its own conjugation and auxiliary verbs. Do NOT merge separate words into one entry.
   - Keep together: verb/adjective stems with their endings and auxiliaries (聞いています, 掃除させた, 忘れてしまった, 叱られた, 甘くなかった, 見てみたい).
   - Split off as attachedParticle: particles that link clauses (から, ので, のに, ながら, けど, たら's ら, と, て is NOT split). Example: "読みながら" → { text: "読み", attachedParticle: { text: "ながら", ... } }; "降ったら" → { text: "降った", attachedParticle: { text: "ら", ... } }.
   - Split off as their own word: copulas and sentence-ending auxiliaries (だ, です, でしょう, らしい). Examples: "中止になるでしょう" → "中止" (に) | "なる" | "でしょう"; "マンションになっている" → "マンション" (に) | "なっている".
   - Nouns joined by の are separate words: "子供の頃" → "子供" (の) | "頃".
   - Each character of the sentence belongs to exactly one word or attached particle. A word's text never starts with the particle attached to the previous word (wrong: "マンション" (に) | "になっている").

TRANSLATION GUIDANCE:
Represent particles by their grammatical function in parentheses in the sentence translation.
Example: "彼女は新しい本を読んでいる。" → "She (topic) new book (object) reading is."

Do not include SOV (subject-object-verb) word order in the grammar points.

EXPLANATION FORMATTING:
- Do not include a translation in the explanation
- Structure the explanation with clear sections
- Highlight important grammatical terms with <strong>
- Use lists for multiple points
Example: "<p>This sentence follows the <strong>SOV pattern</strong>. The topic <strong>私</strong> is marked with は.</p>"`;

/**
 * Thrown when the analysis still fails validation after every repair round.
 * The message never includes sentence text, so it is safe to log.
 */
export class AnalysisValidationError extends Error {
  constructor() {
    super(
      `Analysis failed validation after ${MAX_REPAIR_ATTEMPTS} repair rounds`,
    );
    this.name = "AnalysisValidationError";
  }
}

/**
 * Analyzes a Japanese sentence through OpenRouter.
 * @throws AnalysisValidationError when the result cannot be repaired.
 */
export async function analyzeSentence(
  sentence: string,
): Promise<SentenceAnalysis> {
  const chatModel = createChatModel();

  // Wrap with structured output
  const structuredModel = chatModel.withStructuredOutput(analysisSchema, {
    name: "analyze_sentence",
  });

  // Build prompt with the sentence
  const prompt = ANALYSIS_PROMPT.replace("{{SENTENCE}}", () => sentence);

  // Invoke the model, then send validation errors back until the words
  // rebuild the sentence or the repair budget runs out.
  const messages: BaseMessage[] = [new HumanMessage(prompt)];
  let analysis = (await structuredModel.invoke(messages)) as SentenceAnalysis;
  let errors = validateAnalysis(sentence, analysis);
  for (
    let attempt = 1;
    errors.length > 0 && attempt <= MAX_REPAIR_ATTEMPTS;
    attempt++
  ) {
    log("info", "analysis.validation", {
      operation: "analysis.validate",
      event: `repair_${attempt}`,
    });
    messages.push(
      new AIMessage(JSON.stringify(analysis)),
      new HumanMessage(
        `Your analysis failed validation:\n- ${errors.join("\n- ")}\n\nReturn the complete corrected analysis for the same sentence. Fix the word boundaries and ids so the words, read in position order with their attached particles, reproduce the sentence exactly.`,
      ),
    );
    analysis = (await structuredModel.invoke(messages)) as SentenceAnalysis;
    errors = validateAnalysis(sentence, analysis);
  }
  if (errors.length > 0) throw new AnalysisValidationError();

  // Sanitize HTML content to prevent XSS attacks
  const sanitizedAnalysis: SentenceAnalysis = {
    ...analysis,
    explanation: sanitizeHtml(analysis.explanation, {
      allowedTags: ["p", "strong", "em", "ul", "li", "ol", "br", "span"],
      allowedAttributes: {},
    }),
    grammarPoints: analysis.grammarPoints ?? [],
    words: analysis.words.map((word) => ({
      ...word,
      attachedParticle: word.attachedParticle
        ? {
            ...word.attachedParticle,
            description: sanitizeHtml(word.attachedParticle.description, {
              allowedTags: ["strong", "em", "br"],
              allowedAttributes: {},
            }),
          }
        : null,
    })),
  };

  return sanitizedAnalysis;
}
