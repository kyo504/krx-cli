import { krxFetch, type KrxResponse } from "./client.js";
import { getTradingDays } from "../utils/date.js";

interface DateRangeOptions {
  readonly endpoint: string;
  readonly from: string;
  readonly to: string;
  readonly apiKey: string;
  readonly cache?: boolean;
  readonly concurrency?: number;
  readonly extraParams?: Record<string, string>;
}

interface DateRangeResult<T = Record<string, string>> {
  readonly success: boolean;
  readonly data: readonly T[];
  readonly error?: string;
  readonly fetchedDays: number;
  readonly failedDays: number;
}

const DEFAULT_CONCURRENCY = 5;

async function fetchWithConcurrency<T>(
  tasks: readonly (() => Promise<T>)[],
  concurrency: number,
): Promise<readonly T[]> {
  const slots: Promise<T>[] = new Array(tasks.length);
  let index = 0;

  async function runNext(): Promise<void> {
    while (index < tasks.length) {
      const currentIndex = index;
      index += 1;
      const task = tasks[currentIndex];
      if (task) {
        const result = await task();
        slots[currentIndex] = Promise.resolve(result);
      }
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, tasks.length) },
    () => runNext(),
  );
  await Promise.all(workers);

  return Promise.all(slots);
}

export async function fetchDateRange<T = Record<string, string>>(
  options: DateRangeOptions,
): Promise<DateRangeResult<T>> {
  const { endpoint, from, to, apiKey, cache, extraParams } = options;
  const concurrency = options.concurrency ?? DEFAULT_CONCURRENCY;

  if (from > to) {
    return {
      success: false,
      data: [],
      error: `'from' date (${from}) must not be after 'to' date (${to})`,
      fetchedDays: 0,
      failedDays: 0,
    };
  }

  const tradingDays = getTradingDays(from, to);

  if (tradingDays.length === 0) {
    return { success: true, data: [], fetchedDays: 0, failedDays: 0 };
  }

  const tasks = tradingDays.map((day) => async (): Promise<KrxResponse<T>> => {
    const params: Record<string, string> = {
      basDd: day,
      ...extraParams,
    };

    return krxFetch<T>({
      endpoint,
      params,
      apiKey,
      cache,
    });
  });

  const results = await fetchWithConcurrency(tasks, concurrency);

  const failedDays = results.filter((r) => !r.success).length;
  const mergedData = results
    .filter((r) => r.success)
    .flatMap((r) => [...r.data]);

  if (mergedData.length === 0 && failedDays > 0) {
    return {
      success: false,
      data: [],
      error: `All ${failedDays} trading day(s) failed to fetch`,
      fetchedDays: 0,
      failedDays,
    };
  }

  return {
    success: true,
    data: mergedData,
    fetchedDays: tradingDays.length - failedDays,
    failedDays,
  };
}
