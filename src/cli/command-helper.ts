import type { Command } from "commander";
import { getApiKey } from "../client/auth.js";
import { krxFetch } from "../client/client.js";
import {
  writeOutput,
  writeError,
  formatOutput,
  detectOutputFormat,
} from "../output/formatter.js";
import { EXIT_CODES } from "./exit-codes.js";
import { handleKrxError } from "./error-handler.js";

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

  const result = await krxFetch({
    endpoint,
    params: finalParams,
    apiKey,
  });

  if (!result.success) {
    handleKrxError(result);
  }

  if (result.data.length === 0) {
    writeError(noDataMessage ?? "No data");
    process.exit(EXIT_CODES.NO_DATA);
  }

  const format = detectOutputFormat(parentOpts.output);
  const fields = parentOpts.fields?.split(",");
  writeOutput(
    formatOutput(
      result.data as unknown as Record<string, unknown>[],
      format,
      fields,
    ),
  );
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
