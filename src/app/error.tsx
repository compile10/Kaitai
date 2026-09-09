"use client";

import { clientError } from "@common/monitoring";
import { useEffect } from "react";
import ErrorFallback from "@/components/ErrorFallback";
import { reportClientError } from "@/lib/monitoring/client";
import type { NextJSError } from "@/lib/utils";

export default function AppError({
  error,
  reset,
}: {
  error: NextJSError;
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError(error, clientError.web_boundary);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <ErrorFallback
        title="Something went wrong"
        description="Kaitai couldn’t load this page. Try again, or head home to start over."
        reset={reset}
        digest={error.digest}
      />
    </main>
  );
}
