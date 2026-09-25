import { auth } from "@/lib/auth";

export class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/**
 * Reject browser mutations sent from other sites (CSRF).
 *
 * Browsers set Sec-Fetch-Site, falling back to Origin in older versions; pages
 * cannot forge either. Requests with neither come from native clients or tools,
 * which cannot act on a signed-in browser's behalf.
 */
export async function checkRequestOrigin(request: Request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;

  const site = request.headers.get("sec-fetch-site");
  if (site) {
    if (site === "same-origin" || site === "none") return;
    throw new RequestError("Cross-site request blocked", 403);
  }

  const origin = request.headers.get("origin");
  if (!origin) return;
  const context = await auth.$context;
  // Without a configured base URL (local dev outside Docker), trust the app's own origin.
  const sameOrigin = !context.baseURL && origin === new URL(request.url).origin;
  if (
    !sameOrigin &&
    !context.isTrustedOrigin(origin, { allowRelativePaths: false })
  ) {
    throw new RequestError("Cross-site request blocked", 403);
  }
}
