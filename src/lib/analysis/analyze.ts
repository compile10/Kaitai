import type { Provider, SentenceAnalysis } from "@common/types";
import sanitizeHtml from "sanitize-html";
import { createChatModel } from "./providers";
import { analysisSchema } from "./schema";

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

3. The TOPIC (marked with は or も) should be identified with "isTopic: true". Topics provide context but DO NOT modify other words in the sentence. Topics should have an EMPTY "modifies" array or no "modifies" field.
   Example: "私は" (I) is the topic → { text: "私", attachedParticle: { text: "は", description: "..." }, isTopic: true, modifies: [] }

3. For modification relationships:
   - Adjectives modify nouns
   - Adverbs modify verbs/adjectives
   - Objects (を) modify verbs
   - Topics (は) do NOT modify anything - they provide context only
   - Subjects (が) modify the verb or an adjective they are attached to

Please provide:
1. A direct, literal translation of the sentence into English. Translate as literally as possible, preserving the Japanese word order and structure. It's okay if it sounds unnatural in English -- the goal is to show what the sentence is literally saying word-by-word.
2. Each word/phrase broken down with its reading and part of speech
3. Particles attached to their words (not as separate entries)
4. Mark the topic with "isTopic: true"
5. For each word, which other words it modifies (using word IDs) - EXCEPT topics which should not modify anything
6. A brief explanation of the sentence structure in HTML format. Do not include a translation here.
7. A list of grammar points found in the sentence. For each grammar point:
   - Provide a clear, concise title (e.g., "は (Topic Marker)", "て-form (Connective)", "Potential Form")
   - Write a 2-3 sentence explanation in plain text (no HTML) describing how this grammar point functions, an example from THIS specific sentence
   - Include all significant grammatical structures: particles, verb forms, conjugations, sentence patterns, etc.

EXPLANATION FORMATTING:
- Use HTML tags for better readability: <p>, <strong>, <em>, <ul>, <li>
- Structure the explanation with clear sections
- Highlight important grammatical terms with <strong>
- Use lists for multiple points
Example: "<p>This sentence follows the <strong>SOV pattern</strong>. The topic <strong>私</strong> is marked with は.</p>"`;

/**
 * Analyzes a Japanese sentence using the specified AI provider and model.
 *
 * @param sentence - The Japanese sentence to analyze
 * @param provider - The AI provider to use (e.g., "anthropic", "openai")
 * @param model - The specific model name to use
 * @returns A promise that resolves to the sentence analysis
 * @throws Error if the provider/model cannot be created or the analysis fails
 */
export async function analyzeSentence(
  sentence: string,
  provider: Provider,
  model: string,
): Promise<SentenceAnalysis> {
  // Create chat model with provider factory
  const chatModel = createChatModel(provider, model);

  // Wrap with structured output
  const structuredModel = chatModel.withStructuredOutput(analysisSchema, {
    name: "analyze_sentence",
  });

  // Build prompt with the sentence
  const prompt = ANALYSIS_PROMPT.replace("{{SENTENCE}}", sentence);

  // Invoke the model
  const analysis = (await structuredModel.invoke(prompt)) as SentenceAnalysis;

  // Sanitize HTML content to prevent XSS attacks
  const sanitizedAnalysis: SentenceAnalysis = {
    ...analysis,
    explanation: sanitizeHtml(analysis.explanation, {
      allowedTags: ["p", "strong", "em", "ul", "li", "ol", "br", "span"],
      allowedAttributes: {},
    }),
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
