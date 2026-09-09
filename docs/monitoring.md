# SigNoz monitoring

Kaitai exports OpenTelemetry traces and structured logs to an existing SigNoz
collector over OTLP/HTTP.

## Connect an instance

Set these **server-only** environment variables on the web deployment:

```dotenv
OTEL_EXPORTER_OTLP_ENDPOINT=https://ingest.us.signoz.cloud:443
OTEL_EXPORTER_OTLP_HEADERS=signoz-ingestion-key=YOUR_INGESTION_KEY
OTEL_SERVICE_NAME=kaitai-web
OTEL_RESOURCE_ATTRIBUTES=deployment.environment.name=production,service.version=YOUR_RELEASE_ID
```

Use the endpoint and ingestion key supplied by your SigNoz instance. The base
endpoint must support OTLP/HTTP; the exporters append `/v1/traces` and `/v1/logs`.
For self-hosted SigNoz, use its reachable collector address and authentication
settings.

Leave `OTEL_EXPORTER_OTLP_ENDPOINT` unset to disable export. JSON logs still go to
standard output. Restart the web process after changing configuration. Never put
the ingestion key in `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`, or a mobile binary.

## Coverage

- Next.js server spans, explicit API request spans, request IDs, response status,
  and duration. No database or LLM auto-instrumentation is enabled.
- LangChain callbacks create child spans for successful and failed model calls
  in sentence analysis and image extraction. Duration includes SDK retries and
  backoff; individual transport attempts are not recorded. `ai.timeout` records
  a model call ending with a recognized SDK or platform timeout error.
  Structured-output parsing happens outside the model span; route error reporting
  captures parsing failures.
  Retry behavior and timeout settings remain controlled by the existing SDK.
  No provider/model fallback is configured, so no fallback event is emitted.
- Unhandled Next.js server errors, caught route failures, returned 5xx responses,
  OCR failures, and history-write failures.
- All three web error boundaries, browser unhandled errors/rejections, and
  TanStack Query failures.
- Expo Router's root error boundary, analysis/history failures, and TanStack
  Query failures. Mobile reports use the existing API origin.
- The invite validation bypass emits a `FATAL` log with
  `event=auth.invite_bypass`, plus an exception. Delivery is flushed with a bounded
  wait; collector outages cannot hold signup recovery indefinitely.

Web and mobile reports go through `/api/telemetry`, which validates a fixed set
of operation names, limits body size and request rate, and marks reports with
`client.reported=true` and `client.platform=web|mobile`. This route allows signed-out
reports for login and root-boundary failures. Client reports are untrusted and
cannot emit the server's fatal security event. They appear under the web service
because the server creates their exception spans and logs.

Accepted reports return HTTP 202 with `{ accepted: true }`. Acceptance does not
confirm delivery to the collector.

Application error responses created by `jsonResponse` include `traceId` for
HTTP 4xx and 5xx responses when a valid active span exists. This identifies the
original failing API request for lookup in SigNoz. Success responses omit it,
including telemetry acknowledgments. A rejected telemetry submission can carry
the trace ID of that rejected submission. Better Auth's own responses and the
health probe do not use this JSON helper.

Client reporting allows repeated Error objects, limits reports to one per second
per reporter, and ignores delivery failures. It does **not** persist reports offline, capture
native iOS/Android crashes, install a mobile global exception handler, or
symbolicate production Hermes/native stacks. Those require a separate mobile
monitoring phase. An unavailable API also prevents client report delivery.

## Data handling

`common/redaction.ts` owns shared credential, email, URL, and labelled-content
redaction rules. Message formatting, stack parsing, and event attribute handling
reuse these rules while preserving their own structure and limits.

Error logs include a sanitized `exception.message` alongside the stable operation
label; exception span events retain the same diagnostic summary. Client messages
are sanitized before transmission and again on the server. Reports from older
clients without a message use their operation label as a fallback.

Messages retain their first line, capped at 1,000 characters. Redaction removes
URL credentials and query parameters, analysis URL sentences, email addresses,
common authentication tokens, labelled credentials/request/provider content, and
structured payloads. Request bodies, headers, and user identities are not attached
to reports. These patterns cannot identify every sensitive value in arbitrary
free text. Stack frames retain code locations with URL credentials, query
parameters, and analysis URLs removed.
Stack locations are parsed with `error-stack-parser-es` and formatted consistently
across clients and the server. Hermes bytecode offsets remain unsymbolicated.
Framework spans are filtered before export to exclude request URLs and arbitrary
attributes; only explicitly captured errors retain sanitized stack traces.
All span event types are exported with their names and timestamps preserved, so
operators can filter them in SigNoz. Event attributes, including extra exception
attributes, retain numeric/boolean values and sanitize string values, including
string arrays.
Attributes labelled as credentials or request/provider content are redacted.
Exception messages and stacks use the dedicated sanitizers described above.
The AI callback handler ignores model inputs and outputs, including prompts and images.

The collector endpoint and its ingestion credentials are deployment secrets.
Operators should control access to retained traces and logs, including stack
locations. Default SDK batching is memory-based and can lose pending records on
an abrupt process exit.

## SigNoz setup

1. Find service `kaitai-web` in Services/APM after exercising an API route.
2. Search Logs for `api.request`; use `request_id` and trace IDs to correlate a
   request with its exception. Search `web.boundary` or `mobile.boundary` for
   client reports. Exceptions are also recorded as span events for SigNoz's
   Exceptions view.
3. Create a **log-based alert** filtering `service.name = 'kaitai-web'` and
   `event = 'auth.invite_bypass'`. Aggregate `count()`, trigger when the total is
   above zero over five minutes, and evaluate every minute. Configure notification
   routing and repeat notifications, then use SigNoz's Test Notification action.
   A sustained alert may group several incidents into one notification.
4. Configure error alerts for server exceptions or returned 5xx responses as
   needed. Client reports and operational errors are distinguishable from the
   fatal invite-bypass event.
5. Set log and trace retention to cover the beta window, for example 90 days,
   **before** beta traffic begins. SigNoz's documented default for logs/traces is
   15 days; retention increases do not restore expired data.

Alert destinations and retention belong to your SigNoz instance. The application
integration does not configure them or send notification messages itself.

## Verification

After configuring your real collector, exercise an API route, verify its trace
and log in SigNoz, and verify the notification channel using Test Notification.
Use a release mobile build for mobile validation. Native crash coverage and
readable release stack traces are not implied by these basic checks.

References: [Next.js OpenTelemetry](https://nextjs.org/docs/app/guides/open-telemetry),
[SigNoz log alerts](https://signoz.io/docs/alerts-management/log-based-alerts/),
[SigNoz retention](https://signoz.io/docs/userguide/retention-period/).
