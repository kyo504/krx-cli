import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import {
  incrementCallCount,
  checkRateLimit,
  getRateLimitStatus,
} from "../../src/client/rate-limit.js";

vi.mock("node:fs");

describe("rate-limit", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function mockToday(): string {
    const now = new Date();
    const yyyy = now.getFullYear().toString();
    const mm = (now.getMonth() + 1).toString().padStart(2, "0");
    const dd = now.getDate().toString().padStart(2, "0");
    return `${yyyy}${mm}${dd}`;
  }

  it("starts with zero count", () => {
    vi.mocked(fs.readFileSync).mockImplementation(() => {
      throw new Error("not found");
    });
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

    const status = getRateLimitStatus();
    expect(status.count).toBe(0);
    expect(status.remaining).toBe(10000);
  });

  it("increments count", () => {
    const today = mockToday();
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ date: today, count: 5 }),
    );
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

    const result = incrementCallCount();
    expect(result.count).toBe(6);
  });

  it("resets count on new day", () => {
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ date: "20200101", count: 9999 }),
    );
    vi.mocked(fs.mkdirSync).mockReturnValue(undefined);
    vi.mocked(fs.writeFileSync).mockReturnValue(undefined);

    const result = incrementCallCount();
    expect(result.count).toBe(1);
  });

  it("allows when under limit", () => {
    const today = mockToday();
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ date: today, count: 100 }),
    );

    const status = checkRateLimit();
    expect(status.allowed).toBe(true);
    expect(status.warning).toBe(false);
  });

  it("warns at 80% threshold", () => {
    const today = mockToday();
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ date: today, count: 8000 }),
    );

    const status = checkRateLimit();
    expect(status.allowed).toBe(true);
    expect(status.warning).toBe(true);
  });

  it("blocks at limit", () => {
    const today = mockToday();
    vi.mocked(fs.readFileSync).mockReturnValue(
      JSON.stringify({ date: today, count: 10000 }),
    );

    const status = checkRateLimit();
    expect(status.allowed).toBe(false);
  });
});
