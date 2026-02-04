import { ChatAnthropic } from "@langchain/anthropic";
import { ChatOpenAI } from "@langchain/openai";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatXAI } from "@langchain/xai";
import { type NextRequest, NextResponse } from "next/server";
import sanitizeHtml from "sanitize-html";
import { z } from "zod";
import type { SentenceAnalysis, Provider } from "@/types/analysis";

// CORS headers configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // In production, replace with your specific origins
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// Helper to create JSON response with CORS headers
function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: corsHeaders,
  });
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// Cache for memoizing API responses
interface CacheEntry {
  data: SentenceAnalysis;
  timestamp: number;
}

const responseCache = new Map<string, CacheEntry>();
const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

// Clean up expired cache entries
function cleanExpiredCache() {
  const now = Date.now();
  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp > CACHE_DURATION_MS) {
      responseCache.delete(key);
    }
  }
}

// Get cached response if available and not expired
function getCachedResponse(cacheKey: string): SentenceAnalysis | null {
  const cached = responseCache.get(cacheKey);
  if (cached) {
    const now = Date.now();
    if (now - cached.timestamp <= CACHE_DURATION_MS) {
      return cached.data;
    }
    // Expired, remove it
    responseCache.delete(cacheKey);
  }
  return null;
}

// Store response in cache
function setCachedResponse(cacheKey: string, data: SentenceAnalysis) {
  responseCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
  });
  
  // Periodically clean up expired entries
  if (responseCache.size > 100) {
    cleanExpiredCache();
  }
}

// Define the Zod schema for structured output
const analysisSchema = z.object({
  originalSentence: z.string().describe("The original Japanese sentence"),
  words: z.array(
    z.object({
      id: z.string().describe("Unique identifier for this word/phrase"),
      text: z.string().describe("The actual text of the word/phrase in Japanese (NOT including particles - those go in attachedParticle)"),
      reading: z.string().nullable().describe("Hiragana reading of the word (optional)"),
      partOfSpeech: z.string().describe("Part of speech (e.g., noun, verb, adjective, particle, etc.)"),
      modifies: z.array(z.string()).nullable().describe("Array of IDs of words/phrases that this word modifies or relates to"),
      position: z.number().describe("Position in the sentence (0-indexed)"),
      attachedParticle: z.object({
        text: z.string().describe("The particle text (e.g., は, を, に, が, etc.)"),
        reading: z.string().nullable().describe("Hiragana reading of the particle (optional)"),
        description: z.string().describe("A brief explanation of what this particle does in this specific sentence context (1-2 sentences)"),
      }).nullable().describe("Particle attached to this word (if any). Do NOT create separate word entries for particles."),
      isTopic: z.boolean().nullable().describe("True if this word is the sentence topic. Topics provide context but don't modify the main sentence."),
    })
  ),
  explanation: z.string().describe("Brief HTML-formatted explanation of the sentence structure. Use HTML tags like <p>, <strong>, <em>, <ul>, <li> for better formatting."),
  isFragment: z.boolean().describe("True if this is a sentence fragment or incomplete sentence (e.g., missing a verb, incomplete thought, or not a grammatically complete sentence). False if it's a complete sentence."),
});

// Provider configuration
const PROVIDER_CONFIG = {
  anthropic: {
    name: "Anthropic",
    envKey: "ANTHROPIC_API_KEY",
  },
  openai: {
    name: "OpenAI",
    envKey: "OPENAI_API_KEY",
  },
  google: {
    name: "Google Gemini",
    envKey: "GOOGLE_API_KEY",
  },
  xai: {
    name: "xAI",
    envKey: "XAI_API_KEY",
  },
  openrouter: {
    name: "OpenRouter",
    envKey: "OPENROUTER_API_KEY",
  },
} as const;

// Provider factory function
function createChatModel(provider: Provider, model: string) {
  const config = PROVIDER_CONFIG[provider];
  const apiKey = process.env[config.envKey];

  if (!apiKey) {
    throw new Error(`Server Error: Key not properly set for ${config.name}.`);
  }

  switch (provider) {
    case "anthropic":
      return new ChatAnthropic({
        model,
        anthropicApiKey: apiKey,
        maxTokens: 4096,
      });

    case "openai":
      return new ChatOpenAI({
        model,
        openAIApiKey: apiKey,
        maxTokens: 4096,
      });

    case "google":
      return new ChatGoogleGenerativeAI({
        model,
        apiKey,
        maxOutputTokens: 4096,
      });

    case "xai":
      return new ChatXAI({
        model,
        apiKey,
        maxTokens: 4096,
      });

    case "openrouter":
      return new ChatOpenAI({
        model,
        configuration: {
          apiKey,
          baseURL: "https://openrouter.ai/api/v1",
        },
        maxTokens: 4096,
      });

    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { sentence, provider, model } = await request.json();

    if (!sentence || typeof sentence !== "string") {
      return jsonResponse({ error: "Invalid sentence provided" }, 400);
    }

    if (!provider || typeof provider !== "string") {
      return jsonResponse({ error: "Invalid provider specified" }, 400);
    }

    if (!model || typeof model !== "string") {
      return jsonResponse({ error: "Invalid model specified" }, 400);
    }

    // Check cache first (include provider and model in cache key)
    const cacheKey = `${provider}:${model}:${sentence}`;
    const cachedResponse = getCachedResponse(cacheKey);
    if (cachedResponse) {
      return jsonResponse(cachedResponse);
    }

    // Create chat model with provider factory
    let chatModel;
    try {
      chatModel = createChatModel(provider as Provider, model);
    } catch (error) {
      return jsonResponse(
        { error: error instanceof Error ? error.message : "Failed to create model" },
        500,
      );
    }

    const structuredModel = chatModel.withStructuredOutput(analysisSchema, {
      name: "analyze_sentence",
    });

    const prompt = `Analyze the following Japanese sentence and break it down into its constituent words and phrases. For each word/phrase, identify what it modifies or relates to in the sentence. This will be used to create a visual diagram showing the grammatical relationships.

Sentence: ${sentence}

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

Please provide:
1. Each word/phrase broken down with its reading and part of speech
2. Particles attached to their words (not as separate entries)
3. Mark the topic with "isTopic: true"
4. For each word, which other words it modifies (using word IDs) - EXCEPT topics which should not modify anything
5. A brief explanation of the sentence structure in HTML format

EXPLANATION FORMATTING:
- Use HTML tags for better readability: <p>, <strong>, <em>, <ul>, <li>
- Structure the explanation with clear sections
- Highlight important grammatical terms with <strong>
- Use lists for multiple points
Example: "<p>This sentence follows the <strong>SOV pattern</strong>. The topic <strong>私</strong> is marked with は.</p>"`;

    const analysis = await structuredModel.invoke(prompt) as SentenceAnalysis;
    
    // Sanitize HTML content to prevent XSS attacks
    const sanitizedAnalysis: SentenceAnalysis = {
      ...analysis,
      explanation: sanitizeHtml(analysis.explanation, {
        allowedTags: ['p', 'strong', 'em', 'ul', 'li', 'ol', 'br', 'span'],
        allowedAttributes: {},
      }),
      words: analysis.words.map(word => ({
        ...word,
        attachedParticle: word.attachedParticle
          ? {
              ...word.attachedParticle,
              description: sanitizeHtml(word.attachedParticle.description, {
                allowedTags: ['strong', 'em', 'br'],
                allowedAttributes: {},
              }),
            }
          : null,
      })),
    };
    
    // Cache the successful response
    setCachedResponse(cacheKey, sanitizedAnalysis);
    
    return jsonResponse(sanitizedAnalysis);
  } catch (error) {
    console.error("Error analyzing sentence:", error);
    return jsonResponse({ error: "Failed to analyze sentence" }, 500);
  }
}
