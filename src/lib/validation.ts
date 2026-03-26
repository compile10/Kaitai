export function sanitizeForLLM(input: string): string {
  return input
    // Strip ASCII control chars except tab (\x09), LF (\x0A), CR (\x0D)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    // Strip Unicode bidirectional/formatting override characters
    .replace(/[\u202A-\u202E\u2066-\u2069]/g, "")
    .trim();
}

const MODEL_ID_PATTERN = /^[a-zA-Z0-9\-_./: ]+$/;
const MAX_MODEL_LENGTH = 200;

export function isValidModelId(model: unknown): model is string {
  return (
    typeof model === "string" &&
    model.length > 0 &&
    model.length <= MAX_MODEL_LENGTH &&
    MODEL_ID_PATTERN.test(model)
  );
}
