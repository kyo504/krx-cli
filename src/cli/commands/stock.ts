import { Command } from "commander";
import { getApiKey } from "../../client/auth.js";
import { krxFetch } from "../../client/client.js";
import { validateDate, validateMarket } from "../../validator/index.js";
import {
  writeOutput,
  writeError,
  formatOutput,
  detectOutputFormat,
} from "../../output/formatter.js";
import { EXIT_CODES } from "../index.js";
import { handleKrxError } from "../error-handler.js";

const TRADING_ENDPOINTS: Record<string, string> = {
  kospi: "/svc/apis/sto/stk_bydd_trd",
  kosdaq: "/svc/apis/sto/ksq_bydd_trd",
  konex: "/svc/apis/sto/knx_bydd_trd",
};

const INFO_ENDPOINTS: Record<string, string> = {
  kospi: "/svc/apis/sto/stk_isu_base_info",
  kosdaq: "/svc/apis/sto/ksq_isu_base_info",
  konex: "/svc/apis/sto/knx_isu_base_info",
};

export function registerStockCommand(program: Command): void {
  const stock = program.command("stock").description("Query KRX stock data");

  stock
    .command("list")
    .description("List stock daily trading data")
    .requiredOption("--date <date>", "trading date (YYYYMMDD)")
    .option("--market <market>", "market: kospi, kosdaq, konex", "kospi")
    .action(async (opts: { date: string; market: string }) => {
      try {
        const date = validateDate(opts.date);
        const market = validateMarket(opts.market);

        const endpoint = TRADING_ENDPOINTS[market];
        if (!endpoint) {
          writeError(`Invalid market for stock list: ${market}`);
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

  stock
    .command("info")
    .description("List stock base information")
    .option("--market <market>", "market: kospi, kosdaq, konex", "kospi")
    .action(async (opts: { market: string }) => {
      try {
        const market = validateMarket(opts.market);

        const endpoint = INFO_ENDPOINTS[market];
        if (!endpoint) {
          writeError(`Invalid market for stock info: ${market}`);
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
                params: {},
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
          params: {},
          apiKey,
        });

        if (!result.success) {
          handleKrxError(result);
        }

        if (result.data.length === 0) {
          writeError("No data");
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
