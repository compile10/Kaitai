"use client";

import { clientError } from "@common/monitoring";
import {
  MutationCache,
  QueryCache,
  QueryClient,
  QueryClientProvider as TanStackQueryClientProvider,
} from "@tanstack/react-query";
import { type ReactNode, useState } from "react";
import { reportClientError } from "@/lib/monitoring/client";

export function QueryClientProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error) => reportClientError(error, clientError.web_query),
        }),
        mutationCache: new MutationCache({
          onError: (error) =>
            reportClientError(error, clientError.web_mutation),
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: true,
          },
        },
      }),
  );

  return (
    <TanStackQueryClientProvider client={queryClient}>
      {children}
    </TanStackQueryClientProvider>
  );
}
