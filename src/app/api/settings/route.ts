import { z } from "zod";
import { withAuth } from "@/lib/api-auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { RATE_LIMIT_POLICIES } from "@/lib/rate-limit";
import { getUserSettings, updateUserSettings } from "@/lib/settings";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export const GET = withAuth(
  { name: "fetch settings", rateLimit: RATE_LIMIT_POLICIES.settings },
  async (_request, session) => {
    return jsonResponse(await getUserSettings(session.user.id));
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
    return jsonResponse(await updateUserSettings(session.user.id, result.data));
  },
);
