import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import type { Permissions } from "@/lib/auth-permissions";
import { jsonResponse } from "@/lib/cors";
import { observeRoute, reportError } from "@/lib/monitoring/logger";
import { checkRateLimit, type RateLimitPolicy } from "@/lib/rate-limit";
import {
  boundedRequest,
  checkRequestHeader,
  RequestError,
} from "@/lib/request-security";

export type Session = (typeof auth.$Infer)["Session"];

/** The handler a route author writes; `S` says whether a session is guaranteed. */
type Handler<S extends Session | null> = (
  request: NextRequest,
  session: S,
) => Promise<Response>;

/** What a wrapper hands back: the value assigned to `export const GET`. */
const activeRequests = new Map<string, number>();

type RouteExport = (request: NextRequest) => Promise<Response>;

interface RouteConfig {
  name: string;
  rateLimit?: RateLimitPolicy;
  maxBodyBytes?: number;
  maxConcurrent?: number;
}

interface PermissionRouteConfig extends RouteConfig {
  permissions: Permissions;
}

async function enforceRateLimit(
  request: NextRequest,
  session: Session | null,
  policy: RateLimitPolicy | undefined,
): Promise<Response | null> {
  if (!policy) return null;

  const decision = await checkRateLimit(request, session?.user.id, policy);
  if (decision.allowed) return null;

  return jsonResponse(
    { error: decision.message, retryAfter: decision.retryAfter },
    429,
    {
      "Cache-Control": "no-store",
      "Retry-After": String(decision.retryAfter),
      "X-RateLimit-Limit": String(decision.limit),
      "X-RateLimit-Remaining": "0",
      "X-RateLimit-Reset": String(decision.resetAt),
    },
  );
}

/**
 * Preserve request-validation errors; log unexpected failures and return a generic 500.
 *
 * Responses the handler *returns* pass through untouched, so routes keep
 * emitting their own 4xx/5xx (validation failures, upstream errors) directly.
 */
async function catchingErrors(
  label: string,
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof RequestError) {
      return jsonResponse({ error: error.message }, error.status);
    }
    reportError(error, label);
    return jsonResponse({ error: `Failed to ${label}` }, 500);
  }
}

function withSessionLookup(
  route: RouteConfig,
  handler: Handler<Session | null>,
): RouteExport {
  return observeRoute(route.name, (request) =>
    catchingErrors(route.name, async () => {
      checkRequestHeader(request);
      const session = await auth.api.getSession({
        headers: request.headers,
      });
      return handler(request, session);
    }),
  );
}

async function boundedHandler<S extends Session | null>(
  route: RouteConfig,
  request: NextRequest,
  session: S,
  handler: Handler<S>,
): Promise<Response> {
  if (!route.maxConcurrent) {
    return handler(await boundedRequest(request, route.maxBodyBytes), session);
  }
  const active = activeRequests.get(route.name) ?? 0;
  if (route.maxConcurrent && active >= route.maxConcurrent) {
    return jsonResponse({ error: "Service is busy. Try again shortly." }, 503, {
      "Retry-After": "5",
    });
  }
  activeRequests.set(route.name, active + 1);
  try {
    return await handler(
      await boundedRequest(request, route.maxBodyBytes),
      session,
    );
  } finally {
    const remaining = (activeRequests.get(route.name) ?? 1) - 1;
    if (remaining) activeRequests.set(route.name, remaining);
    else activeRequests.delete(route.name);
  }
}

/**
 * Wrap a route that works signed in or signed out; the handler receives the
 * session or null and decides what an anonymous caller gets.
 */
export function withOptionalAuth(
  route: RouteConfig,
  handler: Handler<Session | null>,
): RouteExport {
  return withSessionLookup(route, async (request, session) => {
    const limited = await enforceRateLimit(request, session, route.rateLimit);
    if (limited) return limited;

    return boundedHandler(route, request, session, handler);
  });
}

/** Wrap a route that requires a session, responding 401 when there is none. */
export function withAuth(
  route: RouteConfig,
  handler: Handler<Session>,
): RouteExport {
  return withSessionLookup(route, async (request, session) => {
    if (!session) {
      return jsonResponse({ error: "Authentication required" }, 401);
    }

    const limited = await enforceRateLimit(request, session, route.rateLimit);
    if (limited) return limited;

    return boundedHandler(route, request, session, handler);
  });
}

/**
 * Wrap a route that requires a session holding `permissions`, responding 401
 * when signed out and 403 when the session's role lacks them.
 */
export function withPermission(
  route: PermissionRouteConfig,
  handler: Handler<Session>,
): RouteExport {
  return withAuth(route, async (request, session) => {
    const { success } = await auth.api.userHasPermission({
      body: { userId: session.user.id, permissions: route.permissions },
    });

    if (!success) {
      return jsonResponse({ error: "Permission denied" }, 403);
    }

    return handler(request, session);
  });
}
