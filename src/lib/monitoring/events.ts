import { isSensitiveAttribute, safeMessage } from "@common/redaction";
import {
  type Attributes,
  type AttributeValue,
  trace,
} from "@opentelemetry/api";

/** Keep diagnostic attributes while redacting credentials and request/provider content. */
export function safeEventAttributes(attributes: Attributes = {}): Attributes {
  return Object.fromEntries(
    Object.entries(attributes).map(([key, value]) => {
      if (isSensitiveAttribute(key)) return [key, "<redacted>"];
      const redact = (item: unknown) =>
        typeof item === "string" ? (safeMessage(item) ?? "") : item;
      return [
        key,
        (Array.isArray(value)
          ? value.map(redact)
          : redact(value)) as AttributeValue,
      ];
    }),
  );
}

export function recordEvent(name: string, attributes: Attributes = {}) {
  trace.getActiveSpan()?.addEvent(name, safeEventAttributes(attributes));
}
