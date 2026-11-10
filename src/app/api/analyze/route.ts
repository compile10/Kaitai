import { analyzeForUser } from "@/lib/analysis";
import { withAuth } from "@/lib/api-auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { RATE_LIMIT_POLICIES } from "@/lib/rate-limit";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export const POST = withAuth(
  {
    name: "analyze sentence",
    rateLimit: RATE_LIMIT_POLICIES.analyzeSentence,
  },
  async (request, session) => {
    const body = await request.json().catch(() => null);
    const { analysis } = await analyzeForUser(session.user.id, body?.sentence);
    return jsonResponse(analysis);
  },
);
