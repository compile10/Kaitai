import { authClient } from "./auth-client";

/**
 * Perform a fetch request with Better Auth session cookies attached.
 *
 * Uses authClient.getCookie() as recommended by Better Auth's Expo integration
 * to retrieve the current session cookie. If the user is not signed in, the
 * cookie will be empty and the request proceeds unauthenticated.
 */
export async function authFetch(
  url: string,
  init?: RequestInit,
): Promise<Response> {
  const cookie = authClient.getCookie();
  return fetch(url, {
    ...init,
    credentials: "omit",
    headers: {
      ...init?.headers,
      Cookie: cookie,
    },
  });
}
