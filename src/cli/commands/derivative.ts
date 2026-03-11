import { Command } from "commander";
import { getApiKey } from "../../client/auth.js";
import { krxFetch } from "../../client/client.js";
import { validateDate } from "../../validator/index.js";
import {
  writeOutput,
  writeError,
  formatOutput,
  detectOutputFormat,
} from "../../output/formatter.js";
import { EXIT_CODES } from "../index.js";
import { handleKrxError } from "../error-handler.js";

const TYPE_ENDPOINTS: Record<string, string> = {
  futures: "/svc/apis/drv/fut_bydd_trd",
  "futures-kospi": "/svc/apis/drv/eqsfu_stk_bydd_trd",
  "futures-kosdaq": "/svc/apis/drv/eqkfu_ksq_bydd_trd",
  options: "/svc/apis/drv/opt_bydd_trd",
  "options-kospi": "/svc/apis/drv/eqsop_bydd_trd",
  "options-kosdaq": "/svc/apis/drv/eqkop_bydd_trd",
};

export function registerDerivativeCommand(program: Command): void {
  const derivative = program
    .command("derivative")
    .description("Query KRX derivative data");

  derivative
    .command("list")
    .description("List derivative daily trading data")
    .requiredOption("--date <date>", "trading date (YYYYMMDD)")
    .option(
      "--type <type>",
      "type: futures, futures-kospi, futures-kosdaq, options, options-kospi, options-kosdaq",
      "futures",
    )
    .action(async (opts: { date: string; type: string }) => {
      try {
        const date = validateDate(opts.date);
        const type = opts.type.toLowerCase();

        const endpoint = TYPE_ENDPOINTS[type];
        if (!endpoint) {
          writeError(
            `Invalid type: ${type}. Must be one of: ${Object.keys(TYPE_ENDPOINTS).join(", ")}`,
          );
          process.exit(EXIT_CODES.USAGE_ERROR);
        }

        const apiKey = getApiKey();
        if (!apiKey) {
          writeError(
            "No API key configured. Use 'krx auth set <key>' or set KRX_API_KEY env var.",
          );
          process.exit(EXIT_CODES.AUTH_FAILURE);
        }

        const parentOpts = program.opts();
        if (parentOpts.dryRun) {
          writeOutput(
            JSON.stringify(
              {
                method: "POST",
                endpoint,
                params: { basDd: date },
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
          params: { basDd: date },
          apiKey,
        });

        if (!result.success) {
          handleKrxError(result);
        }

        if (result.data.length === 0) {
          writeError(`No data for date ${date}`);
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
      } catch (err) {
        writeError(err instanceof Error ? err.message : String(err));
        process.exit(EXIT_CODES.USAGE_ERROR);
      }
    });
}
