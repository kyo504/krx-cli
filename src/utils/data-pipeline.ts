import { filterData } from "./filter.js";
import { parseKrxNumber, isKrxNumericString } from "./krx-number.js";

export { parseKrxNumber };

export function sortData(
  data: readonly Record<string, unknown>[],
  field: string,
  direction: "asc" | "desc" = "desc",
): readonly Record<string, unknown>[] {
  const sorted = [...data].sort((a, b) => {
    const aVal = String(a[field] ?? "");
    const bVal = String(b[field] ?? "");

    if (isKrxNumericString(aVal) && isKrxNumericString(bVal)) {
      return parseKrxNumber(aVal) - parseKrxNumber(bVal);
    }

    return aVal.localeCompare(bVal, "ko");
  });

  return direction === "desc" ? sorted.reverse() : sorted;
}

export function limitData(
  data: readonly Record<string, unknown>[],
  limit: number,
): readonly Record<string, unknown>[] {
  return data.slice(0, limit);
}

interface PipelineOptions {
  readonly filter?: string;
  readonly sort?: string;
  readonly direction?: "asc" | "desc";
  readonly limit?: number;
}

export function applyPipeline(
  data: readonly Record<string, unknown>[],
  options: PipelineOptions,
): readonly Record<string, unknown>[] {
  let result = data;

  if (options.filter) {
    result = filterData(result, options.filter);
  }

  if (options.sort) {
    result = sortData(result, options.sort, options.direction ?? "desc");
  }

  if (options.limit && options.limit > 0) {
    result = limitData(result, options.limit);
  }

  return result;
}
