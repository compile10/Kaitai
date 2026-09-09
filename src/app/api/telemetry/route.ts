import { clientError } from "@common/monitoring";
import { MAX_ERROR_MESSAGE_LENGTH, safeMessage } from "@common/redaction";
import { z } from "zod";
import { withOptionalAuth } from "@/lib/api-auth";
import { corsPreflightResponse, jsonResponse } from "@/lib/cors";
import { reportError } from "@/lib/monitoring/logger";
import { RATE_LIMIT_POLICIES } from "@/lib/rate-limit";

const schema = z
  .object({
    operation: z.nativeEnum(clientError),
    message: z.string().max(MAX_ERROR_MESSAGE_LENGTH).optional(),
    stack: z.string().max(6000).optional(),
  })
  .strict();
const MAX_BYTES = 12_000;

export async function OPTIONS() {
  return corsPreflightResponse();
}

export const POST = withOptionalAuth(
  { name: "client.telemetry", rateLimit: RATE_LIMIT_POLICIES.telemetry },
  async (request) => {
    const reader = request.body?.getReader();
    if (!reader) return jsonResponse({ error: "Missing report" }, 400);
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        return jsonResponse({ error: "Report too large" }, 413);
      }
      chunks.push(value);
    }
    let body: unknown;
    try {
      body = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    } catch {
      return jsonResponse({ error: "Invalid report" }, 400);
    }
    const result = schema.safeParse(body);
    if (!result.success) return jsonResponse({ error: "Invalid report" }, 400);
    const { operation, message, stack } = result.data;
    const error = new Error(safeMessage(message) ?? operation);
    if (stack) error.stack = stack;
    reportError(error, operation, {
      "client.platform": operation.startsWith("mobile.") ? "mobile" : "web",
      "client.reported": true,
    });
    return jsonResponse({ accepted: true }, 202, {
      "Cache-Control": "no-store",
    });
  },
);
