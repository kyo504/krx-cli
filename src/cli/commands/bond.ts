import { Command } from "commander";
import { validateDate } from "../../validator/index.js";
import { executeCommand, resolveEndpoint } from "../command-helper.js";

const MARKET_ENDPOINTS: Record<string, string> = {
  kts: "/svc/apis/bon/kts_bydd_trd",
  general: "/svc/apis/bon/bnd_bydd_trd",
  small: "/svc/apis/bon/smb_bydd_trd",
};

export function registerBondCommand(program: Command): void {
  const bond = program.command("bond").description("Query KRX bond data");

  bond
    .command("list")
    .description("List bond daily trading data")
    .requiredOption("--date <date>", "trading date (YYYYMMDD)")
    .option("--market <market>", "market: kts, general, small", "general")
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
