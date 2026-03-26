import type { HistoryEntry, PaginatedHistory } from "@common/types";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { historyCollection } from "@/lib/history";

// Handle CORS preflight requests
export async function OPTIONS() {
  return corsPreflightResponse();
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });
    if (!session) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get("limit")) || 20),
    );
    const skip = (page - 1) * limit;

    // Run count and paginated query in parallel
    const [total, docs] = await Promise.all([
      historyCollection.countDocuments({ userId: session.user.id }),
      historyCollection
        .find({ userId: session.user.id }, { projection: { analysis: 0 } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    const items: HistoryEntry[] = docs.map((doc) => ({
      id: doc._id.toHexString(),
      sentence: doc.sentence,
      provider: doc.provider,
      model: doc.model,
      createdAt: doc.createdAt.toISOString(),
    }));

    const result: PaginatedHistory = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return jsonResponse(result);
  } catch (error) {
    console.error("Error fetching history:", error);
    return jsonResponse(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch history",
      },
      500,
    );
  }
}
