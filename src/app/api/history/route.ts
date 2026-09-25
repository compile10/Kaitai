import type { HistoryEntry, PaginatedHistory } from "@common/types";
import { withAuth } from "@/lib/api-auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { historyCollection } from "@/lib/history";
import { RATE_LIMIT_POLICIES } from "@/lib/rate-limit";

// Handle CORS preflight requests
export async function OPTIONS() {
  return corsPreflightResponse();
}

export const GET = withAuth(
  {
    name: "fetch history",
    rateLimit: RATE_LIMIT_POLICIES.history,
  },
  async (request, session) => {
    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page") ?? 1);
    const limit = Number(searchParams.get("limit") ?? 20);
    if (
      !Number.isSafeInteger(page) ||
      page < 1 ||
      page > 10_000 ||
      !Number.isSafeInteger(limit) ||
      limit < 1 ||
      limit > 100
    ) {
      return jsonResponse({ error: "Invalid pagination parameters" }, 400);
    }
    const skip = (page - 1) * limit;

    // Run count and paginated query in parallel
    const [total, docs] = await Promise.all([
      historyCollection.countDocuments({ userId: session.user.id }),
      historyCollection
        .find(
          { userId: session.user.id },
          { projection: { _id: 1, sentence: 1, createdAt: 1 } },
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    const items: HistoryEntry[] = docs.map((doc) => ({
      id: doc._id.toHexString(),
      sentence: doc.sentence,
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
  },
);
