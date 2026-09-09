import { safeMessage, safeStack } from "./redaction";

export const clientError = {
  web_boundary: "web.boundary",
  web_unhandled: "web.unhandled",
  web_query: "web.query",
  web_mutation: "web.mutation",
  mobile_boundary: "mobile.boundary",
  mobile_analysis: "mobile.analysis",
  mobile_history: "mobile.history",
  mobile_query: "mobile.query",
  mobile_mutation: "mobile.mutation",
} as const;
export type ClientErrorOperation =
  (typeof clientError)[keyof typeof clientError];

export function monitoringError(error: unknown, operation: string): Error {
  const safe = new Error(safeMessage(error) ?? operation);
  const stack = safeStack(error);
  if (stack) safe.stack = `Error: ${safe.message}\n${stack}`;
  return safe;
}

/** Best-effort delivery must never replace the application's recovery behavior. */
export function createClientReporter(send: (body: string) => Promise<unknown>) {
  let lastSent = 0;
  return (error: unknown, operation: ClientErrorOperation) => {
    if (Date.now() - lastSent < 1000) return;
    lastSent = Date.now();
    try {
      void send(
        JSON.stringify({
          operation,
          message: safeMessage(error),
          stack: safeStack(error),
        }),
      ).catch(() => {});
    } catch {
      // Reporting must also tolerate transports that throw before returning a promise.
    }
  };
}
