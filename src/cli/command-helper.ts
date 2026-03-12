import type { Command } from "commander";
import { getApiKey } from "../client/auth.js";
import { krxFetch } from "../client/client.js";
import { fetchDateRange } from "../client/range-fetch.js";
import {
  writeOutput,
  writeError,
  formatOutput,
  detectOutputFormat,
} from "../output/formatter.js";
import { EXIT_CODES } from "./exit-codes.js";
import { handleKrxError } from "./error-handler.js";
import { applyPipeline } from "../utils/data-pipeline.js";
import { validateDate } from "../validator/index.js";

interface ExecuteCommandOptions {
  readonly endpoint: string;
  readonly params: Record<string, string>;
  readonly program: Command;
  readonly noDataMessage?: string;
}

export async function executeCommand(
  options: ExecuteCommandOptions,
): Promise<void> {
  const { endpoint, params, program, noDataMessage } = options;

  const apiKey = getApiKey();
  if (!apiKey) {
    writeError(
      "No API key configured. Use 'krx auth set <key>' or set KRX_API_KEY env var.",
    );
    process.exit(EXIT_CODES.AUTH_FAILURE);
  }

  const parentOpts = program.opts();

  const finalParams = parentOpts.code
    ? { ...params, isuCd: parentOpts.code as string }
    : params;

  if (parentOpts.dryRun) {
    writeOutput(
      JSON.stringify(
        {
          method: "POST",
          endpoint,
          params: finalParams,
          headers: { AUTH_KEY: "***" },
        },
        null,
        2,
      ),
    );
    return;
  }

  const fromDate = parentOpts.from as string | undefined;
  const toDate = parentOpts.to as string | undefined;

  if ((fromDate && !toDate) || (!fromDate && toDate)) {
    writeError("Both --from and --to must be provided together");
    process.exit(EXIT_CODES.USAGE_ERROR);
  }

  if (fromDate) {
    try {
      validateDate(fromDate);
    } catch (err) {
      writeError(
        `Invalid --from date: ${err instanceof Error ? err.message : String(err)}`,
      );
      process.exit(EXIT_CODES.USAGE_ERROR);
    }
  }

  if (toDate) {
    try {
      validateDate(toDate);
    } catch (err) {
      writeError(
        `Invalid --to date: ${err instanceof Error ? err.message : String(err)}`,
      );
      process.exit(EXIT_CODES.USAGE_ERROR);
    }
  }

  const isDateRange = fromDate && toDate;

  let data: Record<string, unknown>[];

  if (isDateRange) {
    const restParams = Object.fromEntries(
      Object.entries(finalParams).filter(([k]) => k !== "basDd"),
    );
    const rangeResult = await fetchDateRange({
      endpoint,
      from: fromDate,
      to: toDate,
      apiKey,
      cache: parentOpts.cache as boolean,
      extraParams: restParams,
    });

    if (!rangeResult.success) {
      writeError(rangeResult.error ?? "Date range fetch failed");
      process.exit(EXIT_CODES.GENERAL_ERROR);
    }

    if (rangeResult.failedDays > 0) {
      writeError(`Warning: ${rangeResult.failedDays} day(s) failed to fetch`);
    }

    data = rangeResult.data as unknown as Record<string, unknown>[];
  } else {
    const result = await krxFetch({
      endpoint,
      params: finalParams,
      apiKey,
      cache: parentOpts.cache as boolean,
    });

    if (!result.success) {
      handleKrxError(result);
    }

    data = result.data as unknown as Record<string, unknown>[];
  }

  if (data.length === 0) {
    writeError(noDataMessage ?? "No data");
    process.exit(EXIT_CODES.NO_DATA);
  }

  data = applyPipeline(data, {
    sort: parentOpts.sort as string | undefined,
    direction: parentOpts.asc ? "asc" : "desc",
    limit: parentOpts.limit as number | undefined,
  }) as Record<string, unknown>[];

  const format = detectOutputFormat(parentOpts.output);
  const fields = parentOpts.fields?.split(",");
  writeOutput(formatOutput(data, format, fields));
}

export function resolveEndpoint(
  endpoints: Record<string, string>,
  key: string,
  label: string,
): string {
  const endpoint = endpoints[key.toLowerCase()];
  if (!endpoint) {
    writeError(
      `Invalid ${label}: ${key}. Must be one of: ${Object.keys(endpoints).join(", ")}`,
    );
    process.exit(EXIT_CODES.USAGE_ERROR);
  }
  return endpoint;
}
