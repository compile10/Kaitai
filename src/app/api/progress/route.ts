import { z } from "zod";
import { withAuth } from "@/lib/api-auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import {
  getAccountProgress,
  MAX_DAILY_QUEST_TARGET,
  normalizeTimeZone,
  updateAccountProgress,
} from "@/lib/progress";
import { RATE_LIMIT_POLICIES } from "@/lib/rate-limit";

export async function OPTIONS() {
  return corsPreflightResponse();
}

export const GET = withAuth(
  { name: "fetch progress", rateLimit: RATE_LIMIT_POLICIES.progress },
  async (_request, session) => {
    return jsonResponse(await getAccountProgress(session.user.id));
  },
);

const updateSchema = z
  .object({
    dailyQuestTarget: z
      .number()
      .int()
      .min(1)
      .max(MAX_DAILY_QUEST_TARGET)
      .optional(),
    timeZone: z.string().nullable().optional(),
  })
  .strict()
  .refine(
    (update) =>
      update.dailyQuestTarget !== undefined || update.timeZone !== undefined,
  );

export const PUT = withAuth(
  { name: "update progress", rateLimit: RATE_LIMIT_POLICIES.progress },
  async (request, session) => {
    const result = updateSchema.safeParse(
      await request.json().catch(() => null),
    );
    if (!result.success) {
      return jsonResponse(
        {
          error: `Send a JSON object with a dailyQuestTarget from 1 to ${MAX_DAILY_QUEST_TARGET}, a timeZone, or both.`,
        },
        400,
      );
    }

    const { dailyQuestTarget, timeZone } = result.data;
    let normalizedTimeZone = timeZone;
    if (timeZone) {
      normalizedTimeZone = normalizeTimeZone(timeZone);
      if (!normalizedTimeZone) {
        return jsonResponse(
          { error: "timeZone must be an IANA time zone, e.g. Asia/Tokyo." },
          400,
        );
      }
    }

    return jsonResponse(
      await updateAccountProgress(session.user.id, {
        dailyQuestTarget,
        timeZone: normalizedTimeZone,
      }),
    );
  },
);
