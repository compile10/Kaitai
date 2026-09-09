import { MAX_SENTENCE_LENGTH } from "@common/api";
import {
  ANALYSIS_MODEL,
  ANALYSIS_PROVIDER,
  analyzeSentence,
  getCachedResponse,
  setCachedResponse,
} from "@/lib/analysis";
import { withAuth } from "@/lib/api-auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { saveToHistory } from "@/lib/history";
import { reportError } from "@/lib/monitoring/logger";
import { RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { sanitizeForLLM } from "@/lib/validation";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export const POST = withAuth(
  {
    name: "analyze sentence",
    rateLimit: RATE_LIMIT_POLICIES.analyzeSentence,
  },
  async (request, session) => {
    const { sentence } = await request.json();

    if (!sentence || typeof sentence !== "string") {
      return jsonResponse({ error: "Invalid sentence provided" }, 400);
    }

    if (sentence.length > MAX_SENTENCE_LENGTH) {
      return jsonResponse(
        {
          error: `Sentence exceeds maximum length of ${MAX_SENTENCE_LENGTH} characters`,
        },
        400,
      );
    }

    const sanitizedSentence = sanitizeForLLM(sentence);

    if (!sanitizedSentence) {
      return jsonResponse({ error: "Invalid sentence provided" }, 400);
    }

    const cacheKey = `${ANALYSIS_PROVIDER}:${ANALYSIS_MODEL}:${sanitizedSentence}`;
    const cachedResponse = getCachedResponse(cacheKey);

    const analysis =
      cachedResponse ?? (await analyzeSentence(sanitizedSentence));

    if (!cachedResponse) {
      setCachedResponse(cacheKey, analysis);
    }

    try {
      await saveToHistory(
        session.user.id,
        sanitizedSentence,
        ANALYSIS_PROVIDER,
        ANALYSIS_MODEL,
      );
    } catch (e) {
      reportError(e, "history.save");
    }

    return jsonResponse(analysis);
  },
);
