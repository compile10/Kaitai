"use client";

import { clientError } from "@common/monitoring";
import { useEffect, useState } from "react";
import ErrorFallback from "@/components/ErrorFallback";
import { reportClientError } from "@/lib/monitoring/client";
import type { NextJSError } from "@/lib/utils";
import "./globals.css";

export default function GlobalError({
  error,
  reset,
}: {
  error: NextJSError;
  reset: () => void;
}) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    let preferredTheme: "light" | "dark" = window.matchMedia?.(
      "(prefers-color-scheme: dark)",
    ).matches
      ? "dark"
      : "light";

    try {
      // Match next-themes' storage key without depending on its provider.
      const savedTheme = window.localStorage.getItem("theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        preferredTheme = savedTheme;
      }
    } catch {
      // Storage may be blocked; keep the system preference in that case.
    }

    setTheme(preferredTheme);
  }, []);

  useEffect(() => {
    reportClientError(error, clientError.web_boundary);
  }, [error]);

  return (
    <html lang="en" className={theme} style={{ colorScheme: theme }}>
      <body style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
        <title>Something went wrong — Kaitai (解体)</title>
        <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
          <ErrorFallback
            title="Kaitai needs a fresh start"
            description="We couldn’t load the app. Try again, or return home to reload Kaitai."
            reset={reset}
            digest={error.digest}
          />
        </main>
      </body>
    </html>
  );
}
