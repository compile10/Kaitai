import { createClientReporter } from "@common/monitoring";

export const reportClientError = createClientReporter((body) =>
  fetch("/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
    keepalive: true,
    credentials: "same-origin",
  }),
);
