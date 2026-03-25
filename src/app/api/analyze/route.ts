import type { NextRequest } from "next/server";
import {
  analyzeSentence,
  getCachedResponse,
  setCachedResponse,
} from "@/lib/analysis";
import { auth } from "@/lib/auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { saveToHistory } from "@/lib/history";
import { resolveSettings } from "@/lib/settings";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    const { sentence } = await request.json();

    if (!sentence || typeof sentence !== "string") {
      return jsonResponse({ error: "Invalid sentence provided" }, 400);
    }

    const { provider, model } = await resolveSettings(session);

    const cacheKey = `${provider}:${model}:${sentence}`;
    const cachedResponse = getCachedResponse(cacheKey);

    const analysis =
      cachedResponse ?? (await analyzeSentence(sentence, provider, model));

    if (!cachedResponse) {
      setCachedResponse(cacheKey, analysis);
    }

    if (session) {
      try {
        await saveToHistory(session.user.id, sentence, provider, model);
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
