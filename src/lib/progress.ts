import type { AccountProgress, AccountProgressUpdate } from "@common/types";
import { db } from "@/lib/db";

/** The column has no upper bound; this keeps targets reachable. */
export const MAX_DAILY_QUEST_TARGET = 1000;
/** Matches the streak_days and forgiven_days column length. */
const DAYS_WINDOW = 366;

const PROGRESS_COLUMNS = [
  "xp",
  "current_streak",
  "longest_streak",
  "last_streak_day",
  "streak_forgiveness_used",
  "streak_days",
  "forgiven_days",
  "daily_quest_target",
  "daily_quest_progress",
  "daily_quest_date",
  "time_zone",
] as const;

interface ProgressRow {
  xp: number;
  current_streak: number;
  longest_streak: number;
  last_streak_day: string | null;
  streak_forgiveness_used: boolean;
  streak_days: string;
  forgiven_days: string;
  daily_quest_target: number;
  daily_quest_progress: number;
  daily_quest_date: string | null;
  time_zone: string | null;
}

const TIME_ZONE_PATTERN = /^[A-Za-z][\w+-]*(?:\/[\w+-]+)*$/;

/**
 * Canonical IANA name for a time zone, or null if the runtime doesn't know it.
 * Offset strings such as "+09:00" are rejected; only named zones are stored.
 */
export function normalizeTimeZone(timeZone: string): string | null {
  if (timeZone.length > 64 || !TIME_ZONE_PATTERN.test(timeZone)) return null;
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone }).resolvedOptions()
      .timeZone;
  } catch {
    return null;
  }
}

/** Wall-clock date and time of `now` in `timeZone`; UTC if unset or unknown. */
function zonedParts(
  now: Date,
  timeZone: string | null,
): Record<string, string> {
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  };
  let format: Intl.DateTimeFormat;
  try {
    format = new Intl.DateTimeFormat("en-US", {
      ...options,
      timeZone: timeZone ?? "UTC",
    });
  } catch {
    // A stored zone the runtime no longer recognizes falls back to UTC.
    format = new Intl.DateTimeFormat("en-US", { ...options, timeZone: "UTC" });
  }
  return Object.fromEntries(
    format.formatToParts(now).map((part) => [part.type, part.value]),
  );
}

/** The calendar day of `now` in `timeZone` as YYYY-MM-DD. */
export function calendarDay(now: Date, timeZone: string | null): string {
  const parts = zonedParts(now, timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

/** A YYYY-MM-DD date moved by a whole number of days. */
export function addDays(day: string, days: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/** How far `timeZone`'s wall clock is ahead of UTC at instant `ms`. */
function zoneOffsetMs(ms: number, timeZone: string | null): number {
  const parts = zonedParts(new Date(ms), timeZone);
  const wallClock = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return wallClock - (ms - (ms % 1000));
}

/** The real instant a YYYY-MM-DD day begins in `timeZone`. */
export function startOfDay(day: string, timeZone: string | null): Date {
  const midnight = Date.parse(`${day}T00:00:00Z`);
  // Try the offset at UTC midnight, then the offset at that guess, in case DST
  // changes between them. Where clocks skip midnight (e.g. 23:59 to 01:00),
  // only one guess falls on `day`; otherwise both agree.
  const first = midnight - zoneOffsetMs(midnight, timeZone);
  const second = midnight - zoneOffsetMs(first, timeZone);
  const onDay = [first, second].filter(
    (ms) => calendarDay(new Date(ms), timeZone) === day,
  );
  return new Date(onDay.length > 0 ? Math.min(...onDay) : second);
}

/**
 * The account's current day: today in its time zone, unless the last streak
 * day (or quest progress) is dated later. A local date after it is a new day
 * in any zone; a date up to it is still that day. YYYY-MM-DD strings compare
 * in date order.
 */
export function currentDay(
  row: Pick<ProgressRow, "time_zone" | "last_streak_day" | "daily_quest_date">,
  now = new Date(),
): string {
  let day = calendarDay(now, row.time_zone);
  for (const stored of [row.last_streak_day, row.daily_quest_date]) {
    if (stored !== null && stored > day) day = stored;
  }
  return day;
}

/** Whole days from one YYYY-MM-DD date to another. */
function daysBetween(from: string, to: string): number {
  return (
    (Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) /
    86_400_000
  );
}

/**
 * Re-anchor stored day bits (streak_days or forgiven_days), which count back
 * from the last streak day, so index 0 is `today`. `today` is never before the
 * last streak day.
 */
export function daysFromToday(
  days: string,
  lastStreakDay: string | null,
  today: string,
): string {
  if (lastStreakDay === null) return "";
  const gap = daysBetween(lastStreakDay, today);
  if (gap >= DAYS_WINDOW) return "";
  return ("0".repeat(gap) + days).slice(0, DAYS_WINDOW).replace(/0+$/, "");
}

/**
 * Whether the streak is unbroken on `today`: the last streak day is today or
 * yesterday. The Run endpoint uses this too, to continue the streak or start
 * a new one. Completing a quest on any day sets streak_forgiveness_used back
 * to false, and adds bits to the front of both day bitmasks for the days since
 * the last streak day (a 1 for today in streak_days, 0s otherwise).
 *
 * Today can already be last_streak_day without being played: a forgiven day
 * the player later lives through (by moving back west). Check the bits, not
 * the date: if today's streak_days bit is 0 and its forgiven_days bit is 1,
 * completing the quest turns it into a real streak day (streak_days 1,
 * forgiven_days 0) and adds 1 to the streak.
 */
export function isStreakAlive(
  row: Pick<ProgressRow, "last_streak_day">,
  today: string,
): boolean {
  return (
    row.last_streak_day !== null && row.last_streak_day >= addDays(today, -1)
  );
}

/**
 * Columns to write when the account's time zone changes at `now`. If the move
 * would break a streak that is alive in the old zone, the skipped day is
 * forgiven: the last streak day becomes yesterday in the new zone, and the
 * skipped days are added to the calendar bits as unplayed but forgiven. Only one
 * forgiveness is allowed until a quest is completed on a real day; a second
 * skipped day before then breaks the streak.
 */
export function timeZoneChange(
  row: Pick<
    ProgressRow,
    | "time_zone"
    | "last_streak_day"
    | "daily_quest_date"
    | "streak_forgiveness_used"
    | "streak_days"
    | "forgiven_days"
  >,
  timeZone: string | null,
  now = new Date(),
): {
  time_zone: string | null;
  last_streak_day?: string;
  streak_forgiveness_used?: boolean;
  streak_days?: string;
  forgiven_days?: string;
} {
  const unchanged = { time_zone: timeZone };
  const last = row.last_streak_day;
  if (last === null || row.streak_forgiveness_used) return unchanged;
  const moved = { ...row, time_zone: timeZone };
  const newToday = currentDay(moved, now);
  const skipsADay =
    isStreakAlive(row, currentDay(row, now)) && !isStreakAlive(moved, newToday);
  if (!skipsADay) return unchanged;
  // Move the anchor forward; the skipped days are unplayed but forgiven.
  const lastStreakDay = addDays(newToday, -1);
  const skipped = daysBetween(last, lastStreakDay);
  return {
    time_zone: timeZone,
    last_streak_day: lastStreakDay,
    streak_forgiveness_used: true,
    streak_days: ("0".repeat(skipped) + row.streak_days).slice(0, DAYS_WINDOW),
    forgiven_days: ("1".repeat(skipped) + row.forgiven_days)
      .slice(0, DAYS_WINDOW)
      .replace(/0+$/, ""),
  };
}

/**
 * Stored progress as it stands at `now`: the streak drops to 0 after a day
 * without a completed daily quest, and quest progress counts from 0 on a new
 * day.
 */
export function toAccountProgress(
  row: ProgressRow,
  now = new Date(),
): AccountProgress {
  const today = currentDay(row, now);
  const streakAlive = isStreakAlive(row, today);
  const questCurrent = row.daily_quest_date === today;
  return {
    xp: row.xp,
    currentStreak: streakAlive ? row.current_streak : 0,
    longestStreak: row.longest_streak,
    lastStreakDay: row.last_streak_day,
    streakDays: daysFromToday(row.streak_days, row.last_streak_day, today),
    forgivenDays: daysFromToday(row.forgiven_days, row.last_streak_day, today),
    dailyQuest: {
      target: row.daily_quest_target,
      progress: questCurrent ? row.daily_quest_progress : 0,
    },
    timeZone: row.time_zone,
    dayEndsAt: startOfDay(addDays(today, 1), row.time_zone).toISOString(),
  };
}

/** Every account has an account_progress row; migration 009 creates it on signup. */
export async function getAccountProgress(
  userId: string,
): Promise<AccountProgress> {
  const row = await db
    .selectFrom("account_progress")
    .select(PROGRESS_COLUMNS)
    .where("user_id", "=", userId)
    .executeTakeFirstOrThrow();
  return toAccountProgress(row);
}

/**
 * Save the player-editable progress fields. XP, streaks and quest progress are
 * only changed by finishing a Run, except that a time zone change can forgive
 * a skipped streak day. `update.timeZone` must already be normalized.
 */
export async function updateAccountProgress(
  userId: string,
  update: AccountProgressUpdate,
): Promise<AccountProgress> {
  return db.transaction().execute(async (trx) => {
    const now = new Date();
    // Locked so a concurrent change can't forgive the same skipped day twice.
    const current = await trx
      .selectFrom("account_progress")
      .select(PROGRESS_COLUMNS)
      .where("user_id", "=", userId)
      .forUpdate()
      .executeTakeFirstOrThrow();
    const zoneChanges =
      update.timeZone !== undefined && update.timeZone !== current.time_zone
        ? timeZoneChange(current, update.timeZone, now)
        : {};
    const row = await trx
      .updateTable("account_progress")
      .set({
        ...(update.dailyQuestTarget !== undefined && {
          daily_quest_target: update.dailyQuestTarget,
        }),
        ...zoneChanges,
        updated_at: now,
      })
      .where("user_id", "=", userId)
      .returning(PROGRESS_COLUMNS)
      .executeTakeFirstOrThrow();
    return toAccountProgress(row, now);
  });
}
