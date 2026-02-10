import type { Provider } from "@common/types";
import { type NextRequest, NextResponse } from "next/server";
import {
  analyzeSentence,
  getCachedResponse,
  setCachedResponse,
} from "@/lib/analysis";

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

export async function POST(request: NextRequest) {
  try {
    const { sentence, provider, model } = await request.json();

    // Validate input
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

    // Perform the analysis
    const analysis = await analyzeSentence(
      sentence,
      provider as Provider,
      model,
    );

    // Cache the successful response
    setCachedResponse(cacheKey, analysis);

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
