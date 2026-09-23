import { API_REQUEST_HEADER } from "@common/api";
import { createClientReporter } from "@common/monitoring";

export const reportClientError = createClientReporter((body) =>
  fetch("/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json", [API_REQUEST_HEADER]: "1" },
    body,
    keepalive: true,
    credentials: "same-origin",
  }),
);
