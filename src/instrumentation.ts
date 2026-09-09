import type { Instrumentation } from "next";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startMonitoring } = await import("@/lib/monitoring/server");
    startMonitoring();
    if (process.env.NODE_ENV === "development") {
      const { seedDevAdmin } = await import("@/lib/dev-seed");
      await seedDevAdmin();
    }
  }
}

export const onRequestError: Instrumentation.onRequestError = async (error) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportError } = await import("@/lib/monitoring/logger");
    reportError(error, "server.unhandled");
  }
};
