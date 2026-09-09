import { parseStack } from "error-stack-parser-es/lite";

export const MAX_ERROR_MESSAGE_LENGTH = 1000;
// biome-ignore lint/suspicious/noControlCharactersInRegex: Exported messages must not contain control characters.
const CONTROL_CHARACTERS = /[\u0000-\u001f\u007f]/g;

const SENSITIVE_ATTRIBUTE =
  /authorization|cookie|password|passwd|secret|token|api[._-]?key|invite[._-]?code|sentence|prompt|message[._-]?content|input|output|payload|body|headers?|image/i;

/** Attribute names can identify sensitive values even when their text looks harmless. */
export function isSensitiveAttribute(name: string): boolean {
  return SENSITIVE_ATTRIBUTE.test(name);
}

/** Keep a diagnostic summary without credentials or embedded request/provider data. */
export function safeMessage(error: unknown): string | undefined {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  if (typeof message !== "string" || !message) return undefined;
  return (
    redactDiagnosticText(message.slice(0, 8000).split(/[\r\n]/, 1)[0])
      .replace(/(?:\{|\[(?!sentence\])).*$/, "<redacted>")
      .trim()
      .slice(0, MAX_ERROR_MESSAGE_LENGTH) || undefined
  );
}

/** Retain code locations, excluding exception messages and navigation parameters. */
export function safeStack(error: unknown): string | undefined {
  if (!(error instanceof Error) || !error.stack) return undefined;
  try {
    return (
      parseStack(error.stack)
        .filter(
          (frame) =>
            frame.file &&
            frame.line !== undefined &&
            !frame.raw?.startsWith(`${error.name}:`),
        )
        .slice(0, 20)
        .map((frame) => {
          const name = redactDiagnosticText(frame.function ?? "<anonymous>");
          const file = redactDiagnosticText(frame.file ?? "");
          const column = frame.col === undefined ? "" : `:${frame.col}`;
          return `    at ${name} (${file}:${frame.line}${column})`;
        })
        .join("\n")
        .slice(0, 6000) || undefined
    );
  } catch {
    // Unsupported stack formats must not interrupt error reporting.
    return undefined;
  }
}

/** Redact sensitive text shared by messages, stack-frame fields, and event attributes. */
export function redactDiagnosticText(value: string): string {
  return value
    .replace(/\/analyze\/[^\s)"'<>]+/g, "/analyze/[sentence]")
    .replace(/\b[a-z][a-z\d+.-]*:\/\/[^\s)"'<>]+/gi, (url) =>
      url.split(/[?#]/)[0].replace(/^([a-z][a-z\d+.-]*:\/\/)[^/]*@/i, "$1"),
    )
    .replace(CONTROL_CHARACTERS, " ")
    .replace(
      /\b(authorization|proxy-authorization|cookie|set-cookie|api[ _-]?key|password|passwd|pwd|(?:client[ _-]?)?secret|(?:(?:access|refresh|session|id)[ _-]?)?token|invite[ _-]?code|sentence|prompt|messages?|input|output|payload|body|text|response)\s*["']?\s*[:=].*$/i,
      "$1=<redacted>",
    )
    .replace(/\b(Bearer|Basic)\s+[a-z\d+/_=.-]+/gi, "$1 <redacted>")
    .replace(/\bsk-[a-z\d_-]+\b/gi, "<redacted>")
    .replace(/\beyJ[a-z\d_-]+(?:\.[a-z\d_-]+){0,2}\b/gi, "<redacted>")
    .replace(
      /\b[a-z\d.!#$%&'*+/=?^_`{|}~-]+@[a-z\d.-]+\.[a-z]{2,}\b/gi,
      "<redacted>",
    );
}
