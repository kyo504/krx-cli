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

const MARKET_ENDPOINTS: Record<string, string> = {
  kospi: "/svc/apis/idx/kospi_dd_trd",
  kosdaq: "/svc/apis/idx/kosdaq_dd_trd",
  krx: "/svc/apis/idx/krx_dd_trd",
  bond: "/svc/apis/idx/bon_dd_trd",
  derivative: "/svc/apis/idx/drvprod_dd_trd",
};

export function registerIndexCommand(program: Command): void {
  const index = program.command("index").description("Query KRX index data");

  index
    .command("list")
    .description("List index daily trading data")
    .requiredOption("--date <date>", "trading date (YYYYMMDD)")
    .option(
      "--market <market>",
      "market: kospi, kosdaq, krx, bond, derivative",
      "kospi",
    )
    .action(async (opts: { date: string; market: string }) => {
      try {
        const date = validateDate(opts.date);
        const market = opts.market.toLowerCase();

        const endpoint = MARKET_ENDPOINTS[market];
        if (!endpoint) {
          writeError(
            `Invalid market: ${market}. Must be one of: ${Object.keys(MARKET_ENDPOINTS).join(", ")}`,
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
