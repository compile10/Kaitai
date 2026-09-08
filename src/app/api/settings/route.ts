import { z } from "zod";
import { withAuth } from "@/lib/api-auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { resolveSettings, upsertUserSettings } from "@/lib/settings";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export const GET = withAuth(
  { name: "fetch settings", rateLimit: RATE_LIMIT_POLICIES.settings },
  async (_request, session) => {
    return jsonResponse(await resolveSettings(session));
  },
);

export const PUT = withAuth(
  { name: "update settings", rateLimit: RATE_LIMIT_POLICIES.settings },
  async (request, session) => {
    const result = z
      .object({ showWordTranslations: z.boolean().optional() })
      .strict()
      .safeParse(await request.json().catch(() => null));
    if (!result.success) {
      return jsonResponse(
        {
          error:
            "Send a JSON object with a boolean showWordTranslations setting.",
        },
        400,
      );
    }
    const settings = { ...(await resolveSettings(session)), ...result.data };
    return jsonResponse(await upsertUserSettings(session.user.id, settings));
  },
);
