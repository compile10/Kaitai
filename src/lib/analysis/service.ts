import { MAX_SENTENCE_LENGTH } from "@common/api";
import type { SentenceAnalysis } from "@common/types";
import { ApiError } from "@/lib/cors";
import { saveToHistory } from "@/lib/history";
import { reportError } from "@/lib/monitoring/logger";
import { sanitizeForLLM } from "@/lib/validation";
import { analyzeSentence } from "./analyze";
import { getCachedResponse, setCachedResponse } from "./cache";
import { ANALYSIS_MODEL } from "./client";

/**
 * Validates and sanitizes a sentence, analyzes it through the response cache,
 * and records it in the user's history.
 *
 * Shared by `/api/analyze` and `/api/analyze-image`.
 * @throws ApiError (400) when the input is not a usable sentence.
 */
export async function analyzeForUser(
  userId: string,
  input: unknown,
): Promise<{ sentence: string; analysis: SentenceAnalysis }> {
  if (!input || typeof input !== "string") {
    throw new ApiError("Invalid sentence provided");
  }

  if (input.length > MAX_SENTENCE_LENGTH) {
    throw new ApiError(
      `Sentence exceeds maximum length of ${MAX_SENTENCE_LENGTH} characters`,
    );
  }

  const sentence = sanitizeForLLM(input);
  if (!sentence) {
    throw new ApiError("Invalid sentence provided");
  }

  const cacheKey = `${ANALYSIS_MODEL}:${sentence}`;
  let analysis = getCachedResponse(cacheKey);
  if (!analysis) {
    analysis = await analyzeSentence(sentence);
    setCachedResponse(cacheKey, analysis);
  }

  try {
    await saveToHistory(userId, sentence, ANALYSIS_MODEL);
  } catch (e) {
    reportError(e, "history.save");
  }

  return { sentence, analysis };
}
