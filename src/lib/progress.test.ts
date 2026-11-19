import { describe, expect, it, vi } from "vitest";
import {
  addDays,
  calendarDay,
  currentDay,
  daysFromToday,
  isStreakAlive,
  normalizeTimeZone,
  startOfDay,
  timeZoneChange,
  toAccountProgress,
} from "@/lib/progress";

// progress.ts imports the database pool, which needs DATABASE_URL. These tests
// only cover the pure date logic.
vi.mock("@/lib/db", () => ({ db: {} }));

type ProgressRow = Parameters<typeof toAccountProgress>[0];

const LA = "America/Los_Angeles";
const TOKYO = "Asia/Tokyo";
const HONOLULU = "Pacific/Honolulu";

function row(overrides: Partial<ProgressRow> = {}): ProgressRow {
  return {
    xp: 0,
    current_streak: 0,
    longest_streak: 0,
    last_streak_day: null,
    streak_forgiveness_used: false,
    streak_days: "",
    forgiven_days: "",
    daily_quest_target: 40,
    daily_quest_progress: 0,
    daily_quest_date: null,
    time_zone: null,
    ...overrides,
  };
}

/** The fields that change with the day, at `now`. */
function dayState(progressRow: ProgressRow, now: string) {
  const at = new Date(now);
  const progress = toAccountProgress(progressRow, at);
  return {
    day: currentDay(progressRow, at),
    quest: progress.dailyQuest.progress,
    streak: progress.currentStreak,
    streakDays: progress.streakDays,
    dayEndsAt: progress.dayEndsAt,
  };
}

describe("normalizeTimeZone", () => {
  it("returns the runtime's spelling of a named zone", () => {
    expect(normalizeTimeZone("asia/tokyo")).toBe(TOKYO);
    expect(normalizeTimeZone("UTC")).toBe("UTC");
  });

  it("rejects offsets, unknown zones and overlong input", () => {
    expect(normalizeTimeZone("+09:00")).toBeNull();
    expect(normalizeTimeZone("Mars/Base")).toBeNull();
    expect(normalizeTimeZone(`Asia/${"x".repeat(64)}`)).toBeNull();
  });
});

describe("calendarDay", () => {
  // 2026-11-12 03:00 UTC
  const now = new Date("2026-11-12T03:00:00Z");

  it("is the date in the given zone", () => {
    expect(calendarDay(now, TOKYO)).toBe("2026-11-12");
    expect(calendarDay(now, LA)).toBe("2026-11-11");
  });

  it("uses UTC when the zone is unset or unknown", () => {
    expect(calendarDay(now, null)).toBe("2026-11-12");
    expect(calendarDay(now, "Mars/Base")).toBe("2026-11-12");
  });
});

describe("addDays", () => {
  it("crosses month and year boundaries", () => {
    expect(addDays("2026-02-28", 1)).toBe("2026-03-01");
    expect(addDays("2027-01-01", -1)).toBe("2026-12-31");
  });
});

describe("startOfDay", () => {
  it.each([
    [TOKYO, "2026-11-13", "2026-11-12T15:00:00.000Z"],
    [LA, "2026-11-13", "2026-11-13T08:00:00.000Z"],
    [null, "2026-11-13", "2026-11-13T00:00:00.000Z"],
    ["Asia/Kathmandu", "2026-11-13", "2026-11-12T18:15:00.000Z"],
    ["Mars/Base", "2026-11-13", "2026-11-13T00:00:00.000Z"],
  ])("finds midnight in %s", (zone, day, expected) => {
    expect(startOfDay(day, zone).toISOString()).toBe(expected);
  });

  it.each([
    ["the day clocks spring forward", "2026-03-08", "2026-03-08T05:00:00.000Z"],
    ["the day after spring forward", "2026-03-09", "2026-03-09T04:00:00.000Z"],
    [
      "the day after clocks fall back",
      "2026-11-02",
      "2026-11-02T05:00:00.000Z",
    ],
  ])("handles daylight saving: %s", (_label, day, expected) => {
    expect(startOfDay(day, "America/New_York").toISOString()).toBe(expected);
  });

  // Where daylight saving starts or ends at midnight, the day begins when the
  // local date actually changes.
  it.each([
    ["Santiago, clocks skip midnight", "America/Santiago", "2026-09-06"],
    ["Santiago, clocks repeat the last hour", "America/Santiago", "2026-04-05"],
    ["Havana, clocks skip midnight", "America/Havana", "2026-03-08"],
    ["Beirut, clocks skip midnight", "Asia/Beirut", "2026-03-29"],
    ["Lord Howe, 30-minute shift", "Australia/Lord_Howe", "2026-10-04"],
    ["Chatham, +12:45 to +13:45", "Pacific/Chatham", "2026-09-27"],
  ])("starts the day when the date changes: %s", (_label, zone, day) => {
    const start = startOfDay(day, zone).getTime();
    expect(calendarDay(new Date(start - 1), zone)).toBe(addDays(day, -1));
    expect(calendarDay(new Date(start), zone)).toBe(day);
  });
});

describe("daysFromToday", () => {
  it("shifts stored days so index 0 is today", () => {
    expect(daysFromToday("1101", "2026-11-12", "2026-11-12")).toBe("1101");
    expect(daysFromToday("1101", "2026-11-11", "2026-11-12")).toBe("01101");
  });

  it("is empty with no streak days or when they are over a year old", () => {
    expect(daysFromToday("", null, "2026-11-12")).toBe("");
    expect(daysFromToday("1", "2025-10-08", "2026-11-12")).toBe("");
  });

  it("keeps at most 366 days and drops trailing zeros", () => {
    const stored = `1${"0".repeat(364)}1`;
    expect(daysFromToday(stored, "2026-11-11", "2026-11-12")).toBe("01");
  });
});

describe("toAccountProgress", () => {
  const now = "2026-11-12T03:00:00Z"; // Tokyo Nov 12 12:00

  it("gives a new account an empty progress for today in UTC", () => {
    expect(dayState(row(), now)).toEqual({
      day: "2026-11-12",
      quest: 0,
      streak: 0,
      streakDays: "",
      dayEndsAt: "2026-11-13T00:00:00.000Z",
    });
  });

  it("keeps the streak through yesterday and drops it after", () => {
    const streak = (lastStreakDay: string) =>
      dayState(
        row({
          time_zone: TOKYO,
          current_streak: 5,
          last_streak_day: lastStreakDay,
          streak_days: "1",
        }),
        now,
      ).streak;
    expect(streak("2026-11-12")).toBe(5);
    expect(streak("2026-11-11")).toBe(5);
    expect(streak("2026-11-10")).toBe(0);
  });

  it("counts quest progress only on its own day", () => {
    const quest = (date: string) =>
      dayState(
        row({
          time_zone: TOKYO,
          daily_quest_progress: 28,
          daily_quest_date: date,
        }),
        now,
      ).quest;
    expect(quest("2026-11-12")).toBe(28);
    expect(quest("2026-11-11")).toBe(0);
  });
});

describe("time zone changes", () => {
  describe("moving east (Los Angeles to Tokyo)", () => {
    // Played in Los Angeles on Nov 11; now Tokyo Nov 12 12:00.
    const moved = row({
      time_zone: TOKYO,
      current_streak: 5,
      last_streak_day: "2026-11-11",
      streak_days: "1",
      daily_quest_progress: 28,
      daily_quest_date: "2026-11-11",
    });

    it("ends the stored day and starts the new one", () => {
      expect(dayState(moved, "2026-11-12T03:00:00Z")).toEqual({
        day: "2026-11-12",
        quest: 0,
        streak: 5,
        streakDays: "01",
        dayEndsAt: "2026-11-12T15:00:00.000Z",
      });
    });
  });

  describe("moving west (Tokyo to Honolulu)", () => {
    // Completed Nov 12's quest in Tokyo; Honolulu is still on Nov 11.
    const moved = row({
      time_zone: HONOLULU,
      current_streak: 5,
      last_streak_day: "2026-11-12",
      streak_days: "11",
      daily_quest_progress: 28,
      daily_quest_date: "2026-11-12",
    });
    const carriedOver = {
      day: "2026-11-12",
      quest: 28,
      streak: 5,
      streakDays: "11",
      dayEndsAt: "2026-11-13T10:00:00.000Z",
    };

    it("carries the stored day while the local calendar is behind", () => {
      // Honolulu Nov 11 17:00
      expect(dayState(moved, "2026-11-12T03:00:00Z")).toEqual(carriedOver);
    });

    it("keeps the same day once the local calendar catches up", () => {
      // Honolulu Nov 12 02:00
      expect(dayState(moved, "2026-11-12T12:00:00Z")).toEqual(carriedOver);
    });

    it("starts the next day at dayEndsAt", () => {
      // Honolulu Nov 13 00:00
      expect(dayState(moved, "2026-11-13T10:00:00Z")).toEqual({
        day: "2026-11-13",
        quest: 0,
        streak: 5,
        streakDays: "011",
        dayEndsAt: "2026-11-14T10:00:00.000Z",
      });
    });
  });

  describe("round trip: Los Angeles to Tokyo and back", () => {
    // Completed Nov 11's quest in Los Angeles.
    const playedInLa = row({
      time_zone: LA,
      current_streak: 3,
      last_streak_day: "2026-11-11",
      streak_days: "111",
      daily_quest_progress: 40,
      daily_quest_date: "2026-11-11",
    });
    // Then completed Nov 12's quest in Tokyo, as a Run would record it.
    const playedInTokyo = row({
      time_zone: TOKYO,
      current_streak: 4,
      last_streak_day: "2026-11-12",
      streak_days: "1111",
      daily_quest_progress: 40,
      daily_quest_date: "2026-11-12",
    });

    it("cuts off the Los Angeles day on landing in Tokyo", () => {
      // Tokyo Nov 12 16:00
      expect(
        dayState({ ...playedInLa, time_zone: TOKYO }, "2026-11-12T07:00:00Z"),
      ).toEqual({
        day: "2026-11-12",
        quest: 0,
        streak: 3,
        streakDays: "0111",
        dayEndsAt: "2026-11-12T15:00:00.000Z",
      });
    });

    it("continues Tokyo's day back in Los Angeles on the same date", () => {
      // Los Angeles Nov 12 09:00
      expect(
        dayState({ ...playedInTokyo, time_zone: LA }, "2026-11-12T17:00:00Z"),
      ).toEqual({
        day: "2026-11-12",
        quest: 40,
        streak: 4,
        streakDays: "1111",
        dayEndsAt: "2026-11-13T08:00:00.000Z",
      });
    });

    it("carries Tokyo's day back to Los Angeles while it is still the day before", () => {
      // Los Angeles Nov 11 17:00
      expect(
        dayState({ ...playedInTokyo, time_zone: LA }, "2026-11-12T01:00:00Z"),
      ).toMatchObject({ day: "2026-11-12", quest: 40, streak: 4 });
    });

    it("starts Nov 13 at Los Angeles midnight", () => {
      expect(
        dayState({ ...playedInTokyo, time_zone: LA }, "2026-11-13T08:00:00Z"),
      ).toEqual({
        day: "2026-11-13",
        quest: 0,
        streak: 4,
        streakDays: "01111",
        dayEndsAt: "2026-11-14T08:00:00.000Z",
      });
    });

    // Only a streak day sets the floor, so a Tokyo day without one never began.
    it("returns to the Los Angeles day after flying back without a streak in Tokyo", () => {
      const back = { ...playedInLa, time_zone: LA, daily_quest_progress: 25 };
      // Los Angeles Nov 11 22:00, after an hour in Tokyo on Nov 12.
      expect(dayState(back, "2026-11-12T06:00:00Z")).toMatchObject({
        day: "2026-11-11",
        quest: 25,
        streak: 3,
      });
    });
  });

  describe("forgiving a day skipped by a time zone change", () => {
    /** Apply a zone change the way PUT /api/progress does. */
    function changeZone(
      progressRow: ProgressRow,
      timeZone: string,
      now: string,
    ): ProgressRow {
      return {
        ...progressRow,
        ...timeZoneChange(progressRow, timeZone, new Date(now)),
      };
    }

    // Quest completed in Los Angeles on Nov 11.
    const achievedInLa = row({
      time_zone: LA,
      current_streak: 5,
      last_streak_day: "2026-11-11",
      streak_days: "1",
      daily_quest_progress: 40,
      daily_quest_date: "2026-11-11",
    });

    it("forgives Nov 12 when a red-eye lands in Tokyo on Nov 13", () => {
      // Tokyo 05:00 on Nov 13; Los Angeles is still on Nov 12.
      const landed = "2026-11-12T20:00:00Z";
      const moved = changeZone(achievedInLa, TOKYO, landed);
      expect(moved).toMatchObject({
        last_streak_day: "2026-11-12",
        streak_forgiveness_used: true,
        streak_days: "01",
        forgiven_days: "1",
      });
      expect(dayState(moved, landed)).toMatchObject({
        day: "2026-11-13",
        quest: 0,
        streak: 5,
      });
    });

    it("keeps calendar history on its real dates", () => {
      // Nov 11 done, Nov 10 done, Nov 9 missed, Nov 8 done; Nov 4 forgiven.
      const history = {
        ...achievedInLa,
        streak_days: "1101",
        forgiven_days: "00000001",
      };
      const landed = "2026-11-12T20:00:00Z";
      const progress = toAccountProgress(
        changeZone(history, TOKYO, landed),
        new Date(landed),
      );
      // Index 0 is Tokyo's Nov 13; Nov 12 is skipped but forgiven.
      expect(progress.streakDays).toBe("001101");
      expect(progress.forgivenDays).toBe("0100000001");
    });

    it("changes nothing when the move skips no day", () => {
      // Tokyo 13:00 on Nov 12: Nov 11 is still yesterday there.
      expect(
        timeZoneChange(achievedInLa, TOKYO, new Date("2026-11-12T04:00:00Z")),
      ).toEqual({ time_zone: TOKYO });
    });

    it("changes nothing when moving west", () => {
      const achievedInTokyo = { ...achievedInLa, time_zone: TOKYO };
      expect(
        timeZoneChange(
          achievedInTokyo,
          HONOLULU,
          new Date("2026-11-12T03:00:00Z"),
        ),
      ).toEqual({ time_zone: HONOLULU });
    });

    it("does not revive a streak already broken in the old zone", () => {
      // Los Angeles 01:00 on Nov 13: Nov 12 passed without the quest.
      const late = "2026-11-13T09:00:00Z";
      const moved = changeZone(achievedInLa, TOKYO, late);
      expect(moved.streak_forgiveness_used).toBe(false);
      expect(dayState(moved, late).streak).toBe(0);
    });

    it("breaks the streak when forgiveness was already used", () => {
      const landed = "2026-11-12T20:00:00Z";
      const moved = changeZone(
        { ...achievedInLa, streak_forgiveness_used: true },
        TOKYO,
        landed,
      );
      expect(moved).toMatchObject({
        last_streak_day: "2026-11-11",
        streak_forgiveness_used: true,
      });
      expect(dayState(moved, landed).streak).toBe(0);
    });

    it("forgives only once while switching zones without playing", () => {
      let progressRow = achievedInLa;
      const streaks: number[] = [];
      for (let night = 0; night < 3; night++) {
        // 23:00 in Los Angeles on Nov 12 + night, never playing.
        const at = new Date(Date.UTC(2026, 10, 13 + night, 7)).toISOString();
        progressRow = changeZone(progressRow, TOKYO, at);
        streaks.push(dayState(progressRow, at).streak);
        progressRow = changeZone(progressRow, LA, at);
      }
      expect(streaks).toEqual([5, 0, 0]);
    });

    it("forgives again once a real streak day has reset the flag", () => {
      // As after completing Nov 13 for real: the Run endpoint clears the flag.
      const afterRealDay = {
        ...achievedInLa,
        last_streak_day: "2026-11-13",
        streak_forgiveness_used: false,
      };
      // Red-eye: 23:30 Los Angeles Nov 13, landing Tokyo 05:00 Nov 15.
      const landed = "2026-11-14T20:00:00Z";
      const moved = changeZone(afterRealDay, TOKYO, landed);
      expect(moved).toMatchObject({
        last_streak_day: "2026-11-14",
        streak_forgiveness_used: true,
      });
      expect(dayState(moved, landed).streak).toBe(5);
    });

    it("never revives a streak with no streak day", () => {
      expect(isStreakAlive(row(), "2026-11-12")).toBe(false);
    });
  });
});
