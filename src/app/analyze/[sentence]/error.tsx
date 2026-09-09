"use client";

import { clientError } from "@common/monitoring";
import { useEffect } from "react";
import ErrorFallback from "@/components/ErrorFallback";
import { reportClientError } from "@/lib/monitoring/client";
import type { NextJSError } from "@/lib/utils";

export default function AnalysisError({
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
    <div className="w-full py-12">
      <ErrorFallback
        title="We couldn’t display this analysis"
        description="Try loading the analysis again, or head home to try another sentence."
        reset={reset}
        digest={error.digest}
      />
    </div>
  );
}
