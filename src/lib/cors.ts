import { isSpanContextValid, trace } from "@opentelemetry/api";
import { NextResponse } from "next/server";

/**
 * API calls are same-origin in browsers; native mobile HTTP does not use CORS.
 * Omit Access-Control-Allow-Origin in every environment so other sites' pages
 * cannot read API responses.
 */
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Expose-Headers":
    "Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
};

/**
 * An expected failure to report to the caller, such as invalid input. Route
 * wrappers turn it into a JSON error response with `status` instead of a 500.
 * The message is sent to the client, so it must not contain internal details.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status = 400,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** JSON responses include CORS headers and the originating trace ID on errors. */
export function jsonResponse(
  data: unknown,
  status = 200,
  responseHeaders?: Record<string, string>,
) {
  if (
    status >= 400 &&
    data !== null &&
    typeof data === "object" &&
    !Array.isArray(data)
  ) {
    const spanContext = trace.getActiveSpan()?.spanContext();
    if (spanContext && isSpanContextValid(spanContext)) {
      data = { ...data, traceId: spanContext.traceId };
    }
  }
  return NextResponse.json(data, {
    status,
    headers: {
      ...corsHeaders,
      "Cache-Control": "no-store",
      ...responseHeaders,
    },
  });
}

/** Convenience: 204 preflight response with CORS headers. */
export function corsPreflightResponse() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
