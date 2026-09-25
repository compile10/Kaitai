import { NextRequest } from "next/server";
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

/** Slow uploads may take any time; a body that stops sending this long is abandoned. */
const BODY_IDLE_TIMEOUT_MS = 20_000;

async function readWithIdleTimeout(
  reader: ReadableStreamDefaultReader<Uint8Array>,
) {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const idle = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new RequestError("Request body timed out", 408));
      void reader.cancel().catch(() => {});
    }, BODY_IDLE_TIMEOUT_MS);
  });
  try {
    return await Promise.race([reader.read(), idle]);
  } catch (error) {
    if (error instanceof RequestError) throw error;
    // The client aborted or the connection reset mid-upload; not a server fault.
    throw new RequestError("Request body could not be read", 400);
  } finally {
    clearTimeout(timeout);
  }
}

/** Bound actual bytes before JSON/multipart parsers allocate the full body. */
export async function boundedRequest(request: Request, maxBytes = 16_384) {
  const init = {
    method: request.method,
    headers: request.headers,
    signal: request.signal,
  };
  if (!request.body) return new NextRequest(request.url, init);
  const length = request.headers.get("content-length");
  if (length !== null && !/^\d+$/.test(length)) {
    throw new RequestError("Invalid Content-Length header", 400);
  }
  if (length !== null && Number(length) > maxBytes) {
    throw new RequestError("Request body too large", 413);
  }
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await readWithIdleTimeout(reader);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        void reader.cancel().catch(() => {});
        throw new RequestError("Request body too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new NextRequest(request.url, { ...init, body });
}
