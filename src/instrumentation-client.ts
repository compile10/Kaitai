import { clientError } from "@common/monitoring";
import { reportClientError } from "@/lib/monitoring/client";

window.addEventListener("error", (event) =>
  reportClientError(event.error, clientError.web_unhandled),
);
window.addEventListener("unhandledrejection", (event) =>
  reportClientError(event.reason, clientError.web_unhandled),
);
