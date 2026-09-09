import { AsyncLocalStorage } from "node:async_hooks";
import { monitoringError } from "@common/monitoring";
import { context, SpanStatusCode, trace } from "@opentelemetry/api";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

const requests = new AsyncLocalStorage<{ id: string; reported: boolean }>();
const tracer = trace.getTracer("kaitai");
const logger = logs.getLogger("kaitai");
const severities = {
  info: SeverityNumber.INFO,
  warn: SeverityNumber.WARN,
  error: SeverityNumber.ERROR,
  fatal: SeverityNumber.FATAL,
};

type LogAttributes = {
  operation?: string;
  request_id?: string;
  method?: string;
  status?: number;
  duration_ms?: number;
  event?: string;
  "client.platform"?: string;
  "client.reported"?: boolean;
  "exception.message"?: string;
};

export function log(
  level: keyof typeof severities,
  message: string,
  attributes: LogAttributes = {},
) {
  const span = trace.getActiveSpan()?.spanContext();
  const metadata = { request_id: requests.getStore()?.id, ...attributes };
  const output = JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    service: process.env.OTEL_SERVICE_NAME ?? "kaitai-web",
    trace_id: span?.traceId,
    span_id: span?.spanId,
    ...metadata,
  });
  if (level === "error" || level === "fatal") console.error(output);
  else console.log(output);
  logger.emit({
    context: context.active(),
    severityNumber: severities[level],
    severityText: level.toUpperCase(),
    body: message,
    attributes: metadata,
  });
}

export function reportError(
  error: unknown,
  operation: string,
  attributes: LogAttributes = {},
) {
  const request = requests.getStore();
  if (request) request.reported = true;
  const safe = monitoringError(error, operation);
  const active = trace.getActiveSpan();
  const span = active ?? tracer.startSpan(operation);
  span.recordException(safe);
  span.setStatus({ code: SpanStatusCode.ERROR });
  span.setAttributes({ operation, ...attributes });
  context.with(trace.setSpan(context.active(), span), () =>
    log("error", operation, {
      operation,
      ...attributes,
      "exception.message": safe.message,
    }),
  );
  if (!active) span.end();
}

/** Include failures returned by libraries as well as exceptions caught by routes. */
export function observeRoute<T extends Request>(
  operation: string,
  handler: (request: T) => Promise<Response>,
) {
  return (request: T) =>
    requests.run({ id: crypto.randomUUID(), reported: false }, () =>
      tracer.startActiveSpan(operation, async (span) => {
        const started = performance.now();
        const state = requests.getStore();
        span.setAttributes({
          operation,
          "http.request.method": request.method,
          request_id: state?.id ?? "",
        });
        let status = 500;
        try {
          const response = await handler(request);
          status = response.status;
          if (status >= 500 && !state?.reported)
            reportError(new Error(operation), operation);
          response.headers.set("X-Request-ID", state?.id ?? "");
          return response;
        } catch (error) {
          if (!state?.reported) reportError(error, operation);
          throw error;
        } finally {
          span.setAttribute("http.response.status_code", status);
          if (status >= 500) span.setStatus({ code: SpanStatusCode.ERROR });
          log(status >= 500 ? "error" : "info", "api.request", {
            operation,
            method: request.method,
            status,
            duration_ms: Math.round(performance.now() - started),
          });
          span.end();
        }
      }),
    );
}
