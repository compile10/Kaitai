import { z } from "zod";

// Define the Zod schema for structured output
export const analysisSchema = z.object({
  directTranslation: z
    .string()
    .describe(
      "A direct, literal English translation of the sentence that preserves the Japanese word order and structure as closely as possible, even if it sounds awkward in English",
    ),
  words: z.array(
    z.object({
      id: z.string().describe("Unique identifier for this word/phrase"),
      text: z
        .string()
        .describe(
          "The actual text of the word/phrase in Japanese (NOT including particles - those go in attachedParticle)",
        ),
      reading: z
        .string()
        .nullable()
        .describe("Hiragana reading of the word (optional)"),
      partOfSpeech: z
        .string()
        .describe(
          "Part of speech (e.g., noun, verb, adjective, particle, etc.)",
        ),
      modifies: z
        .array(z.string())
        .nullable()
        .describe(
          "Array of IDs of words/phrases that this word modifies or relates to",
        ),
      position: z.number().describe("Position in the sentence (0-indexed)"),
      attachedParticle: z
        .object({
          text: z
            .string()
            .describe("The particle text (e.g., は, を, に, が, etc.)"),
          reading: z
            .string()
            .nullable()
            .describe("Hiragana reading of the particle (optional)"),
          description: z
            .string()
            .describe(
              "A brief explanation of what this particle does in this specific sentence context (1-2 sentences)",
            ),
        })
        .nullable()
        .describe(
          "Particle attached to this word (if any). Do NOT create separate word entries for particles.",
        ),
      isTopic: z
        .boolean()
        .nullable()
        .describe(
          "True if this word is the sentence topic. Topics provide context but don't modify the main sentence.",
        ),
    }),
  ),
  explanation: z
    .string()
    .describe(
      "Brief HTML-formatted explanation of the sentence structure. Use HTML tags like <p>, <strong>, <em>, <ul>, <li> for better formatting.",
    ),
  isFragment: z
    .boolean()
    .describe(
      "True if this is a sentence fragment or incomplete sentence (e.g., missing a verb, incomplete thought, or not a grammatically complete sentence). False if it's a complete sentence.",
    ),
  grammarPoints: z
    .array(
      z.object({
        title: z
          .string()
          .describe(
            "Grammar point title (e.g., 'は (Topic Marker)', 'て-form (Connective)', 'Potential Form')",
          ),
        explanation: z
          .string()
          .describe(
            "2-3 sentences, plain text (no HTML), explaining how this grammar point functions, with an example from this specific sentence",
          ),
      }),
    )
    .describe(
      "List of grammar points found in the sentence. Identify all significant grammatical structures, particles, verb forms, sentence patterns, etc.",
    ),
});
