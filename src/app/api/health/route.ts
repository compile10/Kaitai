const PING_TIMEOUT_MS = 2_000;

export async function GET() {
  let mongoHealthy = false;

  try {
    // Keep client initialization failures inside the sanitized health response.
    const { default: mongoClient } = await import("@/lib/db");
    const result = await mongoClient.db().command(
      { ping: 1 },
      {
        timeoutMS: PING_TIMEOUT_MS,
        // The operation timeout excludes the driver's initial connection.
        signal: AbortSignal.timeout(PING_TIMEOUT_MS),
      },
    );
    mongoHealthy = result.ok === 1;
  } catch {
    // Public probes expose availability without database or configuration details.
  }

  return Response.json(
    {
      status: mongoHealthy ? "ok" : "error",
      process: "ok",
      mongo: mongoHealthy ? "ok" : "error",
    },
    {
      status: mongoHealthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
