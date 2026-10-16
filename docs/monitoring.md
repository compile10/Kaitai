# Grafana Cloud monitoring

Kaitai exports OpenTelemetry traces and structured logs to Grafana Cloud over
OTLP/HTTP. Traces land in Tempo and logs in Loki.

## Connect a stack

In the Grafana Cloud Portal, open your stack and click **Configure** on the
**OpenTelemetry** tile. Generate a token there, then copy the endpoint and
headers it shows into these **server-only** environment variables on the web
deployment:

```dotenv
OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-west-0.grafana.net/otlp
OTEL_EXPORTER_OTLP_HEADERS=Authorization=Basic%20YOUR_BASE64_CREDENTIALS
OTEL_SERVICE_NAME=kaitai-web
OTEL_RESOURCE_ATTRIBUTES=deployment.environment.name=production,service.version=YOUR_RELEASE_ID
```

Use the endpoint from your own stack's tile; its region may differ. The
exporters append `/v1/traces` and `/v1/logs` to the base endpoint. Keep `%20`
between `Basic` and the credentials; the exporter decodes it.

Leave `OTEL_EXPORTER_OTLP_ENDPOINT` unset to disable export. JSON logs still go to
standard output. Restart the web process after changing configuration. Never put
the token in `NEXT_PUBLIC_*`, `EXPO_PUBLIC_*`, or a mobile binary.

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
original failing API request for lookup in Grafana Tempo. Success responses omit it,
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
redaction rules. Message formatting, stack-text sanitization, and event attribute handling
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
free text. Stack text is sanitized line by line, including URL credentials, query
parameters, analysis URLs, and embedded structured payloads.
Stacks retain their runtime text format without parsing or reconstructing frames.
Sanitization bounds input to 12,000 characters, 40 lines, and 512 characters per
line, then caps exported text at 6,000 characters. Exception messages already
present in stacks are sanitized in place; no duplicate heading is added.
Hermes bytecode offsets remain unsymbolicated.
Framework spans are filtered before export to exclude request URLs and arbitrary
attributes; only explicitly captured errors retain sanitized stack traces.
All span event types are exported with their names and timestamps preserved, so
operators can filter them in Grafana Tempo. Event attributes, including extra exception
attributes, retain numeric/boolean values and sanitize string values, including
string arrays.
Attributes labelled as credentials or request/provider content are redacted.
Exception messages and stacks use the dedicated sanitizers described above.
The AI callback handler ignores model inputs and outputs, including prompts and images.

The collector endpoint and its ingestion credentials are deployment secrets.
Operators should control access to retained traces and logs, including stack
locations. Default SDK batching is memory-based and can lose pending records on
an abrupt process exit.

## Grafana Cloud setup

Loki keeps log attributes as structured metadata and replaces dots with
underscores, so `client.platform` is queried as `client_platform`.

1. In **Explore**, pick the Tempo data source and run
   `{ resource.service.name = "kaitai-web" }` after exercising an API route.
   Exceptions are recorded as span events on the failing span.
2. In **Explore** with the Loki data source, run
   `{service_name="kaitai-web"} |= "api.request"`; use `request_id` and
   `trace_id` to correlate a request with its trace. Query
   `{service_name="kaitai-web"} | operation=~"web.boundary|mobile.boundary"`
   for client reports.
3. Under **Alerting → Alert rules**, create a Grafana-managed rule on the Loki
   data source with
   `sum(count_over_time({service_name="kaitai-web"} | event="auth.invite_bypass" [5m]))`.
   Trigger when it is above zero, evaluate every minute, and treat no data as
   OK. Route it to a contact point, then use the contact point's **Test**
   action. A sustained alert may group several incidents into one notification.
4. Add error alerts for server exceptions or returned 5xx responses as needed,
   for example on `{service_name="kaitai-web"} | status >= 500`. Client
   reports and operational errors are distinguishable from the fatal
   invite-bypass event.
5. The free tier retains logs and traces for 14 days and cannot be extended.
   Export anything needed for longer, or move to a paid plan before beta
   traffic begins; retention increases do not restore expired data.

Alert rules, contact points, and retention belong to your Grafana Cloud stack.
The application integration does not configure them or send notification
messages itself.

## Verification

After configuring your stack, exercise an API route, verify its trace in Tempo
and its log in Loki, and verify the contact point with **Test**. Use a release
mobile build for mobile validation. Native crash coverage and readable release
stack traces are not implied by these basic checks.

References: [Next.js OpenTelemetry](https://nextjs.org/docs/app/guides/open-telemetry),
[Grafana Cloud OTLP](https://grafana.com/docs/grafana-cloud/send-data/otlp/send-data-otlp/),
[Loki OTLP ingestion](https://grafana.com/docs/loki/latest/send-data/otel/).
