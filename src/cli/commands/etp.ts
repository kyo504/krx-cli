import { Command } from "commander";
import { validateDate } from "../../validator/index.js";
import { executeCommand, resolveEndpoint } from "../command-helper.js";

const TYPE_ENDPOINTS: Record<string, string> = {
  etf: "/svc/apis/etp/etf_bydd_trd",
  etn: "/svc/apis/etp/etn_bydd_trd",
  elw: "/svc/apis/etp/elw_bydd_trd",
};

export function registerEtpCommand(program: Command): void {
  const etp = program
    .command("etp")
    .description("Query KRX ETP data (ETF/ETN/ELW)");

  etp
    .command("list")
    .description("List ETP daily trading data")
    .requiredOption("--date <date>", "trading date (YYYYMMDD)")
    .option("--type <type>", "type: etf, etn, elw", "etf")
    .action(async (opts: { date: string; type: string }) => {
      const date = validateDate(opts.date);
      const endpoint = resolveEndpoint(TYPE_ENDPOINTS, opts.type, "type");

      await executeCommand({
        endpoint,
        params: { basDd: date },
        program,
        noDataMessage: `No data for date ${date}`,
      });
    });
}
