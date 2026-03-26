const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

/**
 * Format an ISO date string into a human-readable relative timestamp.
 */
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.floor(hours / 24);
  if (days < 30) return rtf.format(-days, "day");
  const now = new Date();
  const then = new Date(iso);
  const months =
    (now.getFullYear() - then.getFullYear()) * 12 +
    (now.getMonth() - then.getMonth());
  if (months < 12) return rtf.format(-months, "month");
  const years = now.getFullYear() - then.getFullYear();
  return rtf.format(-years, "year");
}
