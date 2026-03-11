import type { KrxResponse } from "../client/client.js";
import { writeError } from "../output/formatter.js";
import { EXIT_CODES } from "./index.js";

export function handleKrxError(result: KrxResponse): never {
  const exitCode =
    result.errorCode === "401"
      ? EXIT_CODES.SERVICE_NOT_APPROVED
      : EXIT_CODES.GENERAL_ERROR;

  writeError(result.error ?? "Unknown error");
  process.exit(exitCode);
}
