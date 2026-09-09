import { NextResponse } from "next/server";

/**
 * Shared CORS headers for JSON and preflight responses.
 *
 * - Non-production: allows all origins with "*".
 * - Production: omits Access-Control-Allow-Origin, so browsers do not allow
 *   cross-origin access to responses.
 *   Same-origin requests (the web app calling its own API) bypass CORS
 *   entirely. The mobile app uses native HTTP and ignores CORS headers.
 */
const corsHeaders: Record<string, string> = {
  ...(process.env.NODE_ENV !== "production"
    ? { "Access-Control-Allow-Origin": "*" }
    : {}),
  "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Expose-Headers":
    "Retry-After, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset",
};

/** Convenience: JSON response with CORS headers attached. */
export function jsonResponse(
  data: unknown,
  status = 200,
  responseHeaders?: Record<string, string>,
) {
  return NextResponse.json(data, {
    status,
    headers: { ...corsHeaders, ...responseHeaders },
  });
}

/** Convenience: 204 preflight response with CORS headers. */
export function corsPreflightResponse() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
