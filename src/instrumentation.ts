import { safeMessage } from "@common/redaction";
import type { Instrumentation } from "next";

export async function register() {
  if (
    process.env.NEXT_RUNTIME === "nodejs" &&
    process.env.NEXT_PHASE !== "phase-production-build"
  ) {
    try {
      const { auth } = await import("@/lib/auth");
      const { default: mongoClient } = await import("@/lib/db");
      // Validate runtime configuration and connect before serving traffic.
      if (process.env.NODE_ENV === "production") {
        const { getOpenRouterApiKey } = await import("@/lib/analysis/client");
        getOpenRouterApiKey();
      }
      await mongoClient.connect();
      await auth.$context;
      const { startMonitoring } = await import("@/lib/monitoring/server");
      startMonitoring();
      if (process.env.NODE_ENV === "development") {
        const { seedDevAdmin } = await import("@/lib/dev-seed");
        await seedDevAdmin();
      }
    } catch (error) {
      if (process.env.NODE_ENV !== "production") throw error;
      // Next.js can retain its listener after a rejected instrumentation hook.
      console.error("Server initialization failed:", safeMessage(error));
      process.exit(1);
    }
  }
}

export const onRequestError: Instrumentation.onRequestError = async (error) => {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { reportError } = await import("@/lib/monitoring/logger");
    reportError(error, "server.unhandled");
  }
};
