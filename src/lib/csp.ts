const isDev = process.env.NODE_ENV === "development";

/**
 * Static policy for every response, set in next.config.ts. Its script-src must
 * admit Next.js inline scripts; pages also get `nonceScriptPolicy`, and
 * browsers enforce both, so only nonce'd scripts run there.
 */
export const STATIC_CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "script-src-attr 'none'",
  // React Flow and the theme provider use inline styles, not inline handlers.
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' blob: data:",
  "font-src 'self'",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** Per-request script policy the proxy adds to pages. */
export function nonceScriptPolicy(nonce: string): string {
  return `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${isDev ? " 'unsafe-eval'" : ""}`;
}
