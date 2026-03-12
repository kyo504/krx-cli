import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatDateToYYYYMMDD,
  isWeekend,
  getRecentTradingDate,
  getTradingDays,
} from "../../src/utils/date.js";

describe("formatDateToYYYYMMDD", () => {
  it("formats date correctly", () => {
    const date = new Date(2026, 2, 10); // March 10, 2026
    expect(formatDateToYYYYMMDD(date)).toBe("20260310");
  });

  it("pads single-digit month and day", () => {
    const date = new Date(2026, 0, 5); // January 5, 2026
    expect(formatDateToYYYYMMDD(date)).toBe("20260105");
  });

  it("handles December 31", () => {
    const date = new Date(2025, 11, 31);
    expect(formatDateToYYYYMMDD(date)).toBe("20251231");
  });
});

describe("isWeekend", () => {
  it("returns true for Saturday", () => {
    const saturday = new Date(2026, 2, 14); // March 14, 2026 = Saturday
    expect(isWeekend(saturday)).toBe(true);
  });

  it("returns true for Sunday", () => {
    const sunday = new Date(2026, 2, 15); // March 15, 2026 = Sunday
    expect(isWeekend(sunday)).toBe(true);
  });

  it("returns false for weekday", () => {
    const monday = new Date(2026, 2, 9); // March 9, 2026 = Monday
    expect(isWeekend(monday)).toBe(false);
  });

  it("returns false for Friday", () => {
    const friday = new Date(2026, 2, 13); // March 13, 2026 = Friday
    expect(isWeekend(friday)).toBe(false);
  });
});

describe("getRecentTradingDate (KST-based)", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  function setKstTime(year: number, month: number, day: number, hour: number) {
    // Create a UTC time that corresponds to the given KST time
    const kstDate = Date.UTC(year, month, day, hour - 9);
    vi.useFakeTimers();
    vi.setSystemTime(kstDate);
  }

  it("returns previous day on Tuesday KST", () => {
    setKstTime(2026, 2, 10, 12); // Tuesday 12:00 KST
    expect(getRecentTradingDate()).toBe("20260309"); // Monday
  });

  it("returns Friday on Monday KST", () => {
    setKstTime(2026, 2, 9, 12); // Monday 12:00 KST
    expect(getRecentTradingDate()).toBe("20260306"); // Friday
  });

  it("returns Friday on Saturday KST", () => {
    setKstTime(2026, 2, 14, 12); // Saturday 12:00 KST
    expect(getRecentTradingDate()).toBe("20260313"); // Friday
  });

  it("returns Friday on Sunday KST", () => {
    setKstTime(2026, 2, 15, 12); // Sunday 12:00 KST
    expect(getRecentTradingDate()).toBe("20260313"); // Friday
  });
});

describe("getTradingDays", () => {
  it("returns weekdays between two dates", () => {
    const days = getTradingDays("20260309", "20260313");
    expect(days).toEqual([
      "20260309",
      "20260310",
      "20260311",
      "20260312",
      "20260313",
    ]);
  });

  it("skips weekends", () => {
    const days = getTradingDays("20260306", "20260310");
    expect(days).toEqual(["20260306", "20260309", "20260310"]);
  });

  it("returns empty for weekend-only range", () => {
    const days = getTradingDays("20260314", "20260315");
    expect(days).toEqual([]);
  });

  it("handles single day", () => {
    const days = getTradingDays("20260310", "20260310");
    expect(days).toEqual(["20260310"]);
  });

  it("handles month boundary", () => {
    const days = getTradingDays("20260227", "20260302");
    expect(days).toEqual(["20260227", "20260302"]);
  });

  it("returns empty when from > to", () => {
    const days = getTradingDays("20260310", "20260309");
    expect(days).toEqual([]);
  });
});
