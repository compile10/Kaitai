import type { Provider } from "@common/types";
import type { NextRequest } from "next/server";
import {
  analyzeSentence,
  getCachedResponse,
  setCachedResponse,
} from "@/lib/analysis";
import { auth } from "@/lib/auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { saveToHistory } from "@/lib/history";
import { isValidModelId } from "@/lib/validation";

// Handle CORS preflight requests
export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function POST(request: NextRequest) {
  try {
    // Get session (null if unauthenticated)
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const { sentence, provider, model } = await request.json();

    // Validate input
    if (!sentence || typeof sentence !== "string") {
      return jsonResponse({ error: "Invalid sentence provided" }, 400);
    }

    if (!provider || typeof provider !== "string") {
      return jsonResponse({ error: "Invalid provider specified" }, 400);
    }

    if (!isValidModelId(model)) {
      return jsonResponse({ error: "Invalid model specified" }, 400);
    }

    // Check cache first (include provider and model in cache key)
    const cacheKey = `${provider}:${model}:${sentence}`;
    const cachedResponse = getCachedResponse(cacheKey);

    const analysis =
      cachedResponse ??
      (await analyzeSentence(sentence, provider as Provider, model));

    // Cache the successful response (no-op if it was already cached)
    if (!cachedResponse) {
      setCachedResponse(cacheKey, analysis);
    }

    // Save to history if the user is authenticated (best-effort)
    if (session) {
      try {
        await saveToHistory(
          session.user.id,
          sentence,
          provider,
          model,
          analysis,
        );
      } catch (e) {
        console.error("Failed to save history:", e);
      }
    }

    return jsonResponse(analysis);
  } catch (error) {
    console.error("Error analyzing sentence:", error);
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Failed to analyze sentence",
      },
      500,
    );
  }
}
