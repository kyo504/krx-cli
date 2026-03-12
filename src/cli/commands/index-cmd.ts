import { Command } from "commander";
import { validateDate } from "../../validator/index.js";
import { executeCommand, resolveEndpoint } from "../command-helper.js";

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
      const date = validateDate(opts.date);
      const endpoint = resolveEndpoint(MARKET_ENDPOINTS, opts.market, "market");

      await executeCommand({
        endpoint,
        params: { basDd: date },
        program,
        noDataMessage: `No data for date ${date}`,
      });
    });
}
