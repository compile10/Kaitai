import { API_REQUEST_HEADER } from "@common/api";
import { NextRequest } from "next/server";

export class RequestError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

/** Custom headers require browser preflight; API CORS must reject untrusted origins. */
export function checkRequestHeader(request: NextRequest) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  if (request.headers.get(API_REQUEST_HEADER) !== "1") {
    throw new RequestError(
      "Required API request header is missing or invalid",
      403,
    );
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
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => {
      reject(new RequestError("Request body timed out", 408));
      void reader.cancel().catch(() => {});
    }, 30_000);
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), deadline]);
      if (done) break;
      size += value.byteLength;
      if (size > maxBytes) {
        void reader.cancel().catch(() => {});
        throw new RequestError("Request body too large", 413);
      }
      chunks.push(value);
    }
  } finally {
    clearTimeout(timeout);
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
