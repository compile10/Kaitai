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
