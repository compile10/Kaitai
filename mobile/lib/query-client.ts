import { clientError } from "@common/monitoring";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";
import { reportMobileError } from "./monitoring";

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => reportMobileError(error, clientError.mobile_query),
  }),
  mutationCache: new MutationCache({
    onError: (error) => reportMobileError(error, clientError.mobile_mutation),
  }),
  defaultOptions: {
    queries: { staleTime: 5 * 60 * 1000, retry: 2 },
  },
});
