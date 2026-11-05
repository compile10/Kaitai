import type { PoolClient } from "pg";

const PING_TIMEOUT_MS = 2_000;

// Coalesce concurrent probes and briefly cache their result per server process.
let pendingProbe: Promise<boolean> | undefined;
let cachedProbe: { healthy: boolean; expiresAt: number } | undefined;

async function probeDatabase() {
  try {
    // Keep pool initialization failures inside the sanitized health response.
    const { pool } = await import("@/lib/db");
    const connecting = pool.connect();
    let timer: NodeJS.Timeout | undefined;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new Error("timeout")), PING_TIMEOUT_MS);
    });
    let client: PoolClient | undefined;
    try {
      client = await Promise.race([connecting, timeout]);
      const result = await Promise.race([
        client.query<{ ok: number }>("SELECT 1 AS ok"),
        timeout,
      ]);
      client.release();
      return result.rows[0]?.ok === 1;
    } catch (error) {
      // Destroy the client so a stuck query or late connection cannot hold a pool slot.
      if (client) client.release(true);
      else
        connecting.then(
          (late) => late.release(true),
          () => {},
        );
      throw error;
    } finally {
      clearTimeout(timer);
    }
  } catch {
    // Public probes expose availability without database or configuration details.
    return false;
  }
}

export async function GET() {
  if (!cachedProbe || cachedProbe.expiresAt <= Date.now()) {
    pendingProbe ??= probeDatabase()
      .then((healthy) => {
        cachedProbe = { healthy, expiresAt: Date.now() + 1000 };
        return healthy;
      })
      .finally(() => {
        pendingProbe = undefined;
      });
    await pendingProbe;
  }
  const databaseHealthy = cachedProbe?.healthy ?? false;

  return Response.json(
    {
      status: databaseHealthy ? "ok" : "error",
      process: "ok",
      database: databaseHealthy ? "ok" : "error",
    },
    {
      status: databaseHealthy ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
