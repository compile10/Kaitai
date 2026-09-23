import { toNextJsHandler } from "better-auth/next-js";
import { auth } from "@/lib/auth";
import { jsonResponse } from "@/lib/cors";
import { observeRoute } from "@/lib/monitoring/logger";
import { boundedRequest, RequestError } from "@/lib/request-security";

const handlers = toNextJsHandler(auth);

export const GET = observeRoute("auth.get", handlers.GET);
export const POST = observeRoute("auth.post", async (request) => {
  try {
    return await handlers.POST(await boundedRequest(request));
  } catch (error) {
    if (error instanceof RequestError) {
      return jsonResponse({ error: error.message }, error.status);
    }
    throw error;
  }
});
