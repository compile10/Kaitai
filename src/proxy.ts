import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

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
  const { pathname } = request.nextUrl;
  const isSignedIn = getSessionCookie(request) !== null;

  // Signed-in users have no reason to see the prelaunch page.
  if (pathname === "/beta") {
    return isSignedIn
      ? NextResponse.redirect(new URL("/", request.url))
      : NextResponse.next();
  }

  if (isSignedIn || PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(new URL("/beta", request.url));
}

export const config = {
  /**
   * Skip /api (the mobile app and Better Auth's own endpoints authenticate
   * themselves and must never be handed an HTML redirect), Next's internals,
   * and any path with a file extension (static assets).
   */
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)"],
};
