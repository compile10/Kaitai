import { fetchAccountProgress, updateAccountProgress } from "@common/api";
import type { AccountProgress } from "@common/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { buildApiUrl } from "@/constants/api";
import { authClient } from "@/lib/auth-client";
import { authFetch } from "@/lib/auth-fetch";

export const PROGRESS_KEY = ["progress"] as const;

function deviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/**
 * The signed-in account's streak, XP and daily quest. Also keeps the account's
 * time zone matched to the device's, since it decides when the day rolls over.
 */
export function useAccountProgress() {
  const { data: session } = authClient.useSession();
  const userId = session?.user.id;
  const queryClient = useQueryClient();
  const queryKey = [...PROGRESS_KEY, userId];

  const query = useQuery({
    queryKey,
    queryFn: () => fetchAccountProgress(buildApiUrl("progress"), authFetch),
    enabled: !!userId,
    // Streak and quest progress change with the date and after every Run.
    staleTime: 60 * 1000,
  });

  const { mutate: saveTimeZone } = useMutation({
    mutationFn: (timeZone: string) =>
      updateAccountProgress(buildApiUrl("progress"), { timeZone }, authFetch),
    onSuccess: (progress: AccountProgress) => {
      queryClient.setQueryData([...PROGRESS_KEY, userId], progress);
    },
  });

  // Try each device zone once per account: the server may store a canonical
  // alias (Asia/Calcutta → Asia/Kolkata) or reject it, and neither should loop.
  const attemptedTimeZone = useRef<string | null>(null);
  const savedTimeZone = query.data?.timeZone;
  const hasProgress = query.data !== undefined;
  useEffect(() => {
    if (!hasProgress) return;
    const timeZone = deviceTimeZone();
    const attempt = `${userId}:${timeZone}`;
    if (
      !timeZone ||
      timeZone === savedTimeZone ||
      attemptedTimeZone.current === attempt
    ) {
      return;
    }
    attemptedTimeZone.current = attempt;
    saveTimeZone(timeZone);
  }, [hasProgress, userId, savedTimeZone, saveTimeZone]);

  return query;
}
