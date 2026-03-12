import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRetry } from "../../src/client/retry.js";

describe("withRetry", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns result on first success", async () => {
    const fn = vi.fn().mockResolvedValue("success");

    const result = await withRetry(fn, { baseDelay: 1 });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on network error and succeeds", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("fetch failed"))
      .mockResolvedValueOnce("success");

    const result = await withRetry(fn, { maxRetries: 3, baseDelay: 1 });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("retries up to maxRetries then throws", async () => {
    const error = new TypeError("fetch failed");
    const fn = vi.fn().mockRejectedValue(error);

    await expect(
      withRetry(fn, { maxRetries: 2, baseDelay: 1 }),
    ).rejects.toThrow("fetch failed");

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry on non-network errors", async () => {
    const error = new Error("HTTP 401 Unauthorized");
    const fn = vi.fn().mockRejectedValue(error);

    await expect(
      withRetry(fn, { maxRetries: 3, baseDelay: 1 }),
    ).rejects.toThrow("HTTP 401 Unauthorized");

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on connection errors", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("ECONNREFUSED"))
      .mockRejectedValueOnce(new Error("ETIMEDOUT"))
      .mockResolvedValueOnce("success");

    const result = await withRetry(fn, { maxRetries: 3, baseDelay: 1 });

    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("defaults to 3 retries when maxRetries is not specified", async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError("fetch failed"));

    await expect(withRetry(fn, { baseDelay: 1 })).rejects.toThrow();

    expect(fn).toHaveBeenCalledTimes(4);
  });

  it("considers TypeError as network error", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce("ok");

    const result = await withRetry(fn, { maxRetries: 2, baseDelay: 1 });

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });
});
