import { Command } from "commander";
import { validateDate, validateMarket } from "../../validator/index.js";
import { executeCommand, resolveEndpoint } from "../command-helper.js";

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
      const date = validateDate(opts.date);
      validateMarket(opts.market);
      const endpoint = resolveEndpoint(
        TRADING_ENDPOINTS,
        opts.market,
        "market",
      );

      await executeCommand({
        endpoint,
        params: { basDd: date },
        program,
        noDataMessage: `No data for date ${date}`,
      });
    });

  stock
    .command("info")
    .description("List stock base information")
    .option("--market <market>", "market: kospi, kosdaq, konex", "kospi")
    .action(async (opts: { market: string }) => {
      validateMarket(opts.market);
      const endpoint = resolveEndpoint(INFO_ENDPOINTS, opts.market, "market");

      await executeCommand({
        endpoint,
        params: {},
        program,
      });
    });
}
