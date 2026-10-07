const PING_TIMEOUT_MS = 2_000;

// Coalesce concurrent probes and briefly cache their result per server process.
let pendingProbe: Promise<boolean> | undefined;
let cachedProbe: { healthy: boolean; expiresAt: number } | undefined;

async function probeMongo() {
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

  return mongoHealthy;
}

export async function GET() {
  if (!cachedProbe || cachedProbe.expiresAt <= Date.now()) {
    pendingProbe ??= probeMongo()
      .then((healthy) => {
        cachedProbe = { healthy, expiresAt: Date.now() + 1000 };
        return healthy;
      })
      .finally(() => {
        pendingProbe = undefined;
      });
    await pendingProbe;
  }
  const mongoHealthy = cachedProbe?.healthy ?? false;

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
