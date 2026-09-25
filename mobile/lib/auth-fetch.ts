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
  const cookie = await authClient.getCookie();
  const headers = new Headers(init?.headers);
  headers.set("Cookie", cookie);
  return fetch(url, {
    ...init,
    credentials: "omit",
    headers,
  });
}
