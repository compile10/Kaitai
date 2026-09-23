import { API_REQUEST_HEADER } from "@common/api";
import { createClientReporter } from "@common/monitoring";
import { API_BASE_URL } from "@/constants/api";

export const reportMobileError = createClientReporter((body) =>
  fetch(`${API_BASE_URL}/api/telemetry`, {
    method: "POST",
    headers: { "Content-Type": "application/json", [API_REQUEST_HEADER]: "1" },
    body,
  }),
);
