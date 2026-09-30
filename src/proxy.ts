import { randomBytes } from "node:crypto";
import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { nonceScriptPolicy, STATIC_CSP } from "@/lib/csp";

/**
 * Prelaunch gate: signed-out visitors only ever see /beta.
 *
 * This is a *routing* gate, not a security boundary. `getSessionCookie` only
 * checks that a session cookie is present — it cannot validate it, because the
 * proxy has no database access. Real enforcement lives in the route wrappers
 * (`withAuth` / `withPermission` in @/lib/api-auth), which verify the session
 * against Mongo on every protected endpoint. A forged cookie gets past the
 * redirect below and still gets a 401 from every API route.
 */

/** Reachable signed out; everything else redirects to /beta. */
const PUBLIC_PATHS = new Set([
  "/beta",
  // Invite holders need to reach sign-up while the gate is up.
  "/sign-up",
]);

export function proxy(request: NextRequest) {
  const nonce = randomBytes(16).toString("base64");
  const policy = nonceScriptPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  // Overwrite client-supplied values before Next.js extracts the script nonce.
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", policy);

  const { pathname } = request.nextUrl;
  const isSignedIn = getSessionCookie(request) !== null;
  let response: NextResponse;
  if (pathname === "/beta" && isSignedIn) {
    response = NextResponse.redirect(new URL("/", request.url));
  } else if (
    isSignedIn ||
    PUBLIC_PATHS.has(pathname) ||
    // Asset-like paths bypass the beta gate but still receive the script policy.
    pathname.includes(".")
  ) {
    response = NextResponse.next({ request: { headers: requestHeaders } });
  } else {
    response = NextResponse.redirect(new URL("/beta", request.url));
  }

  // Setting this header drops next.config.ts's copy, so send both policies;
  // browsers enforce each, so scripts must also carry this request's nonce.
  // Next.js also copies this header onto the request and reads the first
  // script-src for its nonce, so the nonce policy must come first.
  response.headers.set("Content-Security-Policy", policy);
  response.headers.append("Content-Security-Policy", STATIC_CSP);
  // HTML and its nonce must never be reused across document requests.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

export const config = {
  // Include dotted page URLs and prefetches; API routes keep their JSON behavior.
  matcher: ["/((?!api(?:/|$)|_next/static|_next/image).*)"],
};
