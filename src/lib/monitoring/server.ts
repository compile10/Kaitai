import { safeMessage, safeStack } from "@common/redaction";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { envDetector } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  BatchSpanProcessor,
  type ReadableSpan,
  type SpanExporter,
} from "@opentelemetry/sdk-trace-base";
import { safeEventAttributes } from "./events";

/** Only diagnostic metadata crosses the telemetry boundary. Next.js URLs can contain sentences. */
export function sanitizeSpan(span: ReadableSpan): ReadableSpan {
  const allowed = new Set([
    "operation",
    "request_id",
    "http.request.method",
    "http.response.status_code",
    "http.method",
    "http.status_code",
    "next.span_type",
    "client.platform",
    "client.reported",
  ]);
  return {
    ...span,
    spanContext: () => span.spanContext(),
    name:
      span.attributes.operation?.toString() ??
      span.attributes["next.span_type"]?.toString() ??
      "next.request",
    attributes: Object.fromEntries(
      Object.entries(span.attributes).filter(([key]) => allowed.has(key)),
    ),
    status: { code: span.status.code },
    links: [],
    events: span.events.map((event) => {
      if (event.name !== "exception") {
        return { ...event, attributes: safeEventAttributes(event.attributes) };
      }
      const { "exception.stacktrace": stacktrace, ...attributes } =
        event.attributes ?? {};
      const error = new Error();
      error.stack = stacktrace?.toString();
      return {
        ...event,
        attributes: {
          ...safeEventAttributes(attributes),
          "exception.type": "Error",
          "exception.message":
            safeMessage(event.attributes?.["exception.message"]) ??
            span.attributes.operation?.toString() ??
            "server.unhandled",
          // Only our explicitly sanitized exceptions include stack traces.
          ...(span.attributes.operation
            ? {
                "exception.stacktrace": safeStack(error),
              }
            : {}),
        },
      };
    }),
  };
}

let sdk: NodeSDK | undefined;
let spans: BatchSpanProcessor | undefined;
let records: BatchLogRecordProcessor | undefined;

export function startMonitoring() {
  if (sdk || !process.env.OTEL_EXPORTER_OTLP_ENDPOINT) return;
  // Reject invalid configuration instead of silently exporting to a fallback URL.
  for (const name of [
    "OTEL_EXPORTER_OTLP_ENDPOINT",
    "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
    "OTEL_EXPORTER_OTLP_LOGS_ENDPOINT",
  ]) {
    const value = process.env[name];
    if (value === undefined) continue;
    let url: URL;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`${name} must be an HTTP or HTTPS URL`);
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`${name} must be an HTTP or HTTPS URL`);
    }
  }
  const exporter = new OTLPTraceExporter();
  const safeExporter: SpanExporter = {
    export: (items, callback) =>
      exporter.export(items.map(sanitizeSpan), callback),
    shutdown: () => exporter.shutdown(),
  };
  spans = new BatchSpanProcessor(safeExporter);
  records = new BatchLogRecordProcessor({ exporter: new OTLPLogExporter() });
  sdk = new NodeSDK({
    serviceName: process.env.OTEL_SERVICE_NAME ?? "kaitai-web",
    spanProcessors: [spans],
    logRecordProcessors: [records],
    resourceDetectors: [envDetector],
    instrumentations: [],
  });
  sdk.start();
  process.once("SIGTERM", () => {
    void shutdownMonitoring().catch(() => {});
  });
}

export async function flushMonitoring() {
  await Promise.allSettled([spans?.forceFlush(), records?.forceFlush()]);
}

export async function shutdownMonitoring() {
  await sdk?.shutdown();
}
