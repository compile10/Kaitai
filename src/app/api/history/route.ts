import type { HistoryEntry, PaginatedHistory } from "@common/types";
import { withAuth } from "@/lib/api-auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { listHistory } from "@/lib/history";
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
    const { total, rows } = await listHistory(
      session.user.id,
      limit,
      (page - 1) * limit,
    );

    const items: HistoryEntry[] = rows.map((row) => ({
      id: row.id,
      sentence: row.sentence,
      createdAt: row.created_at.toISOString(),
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
