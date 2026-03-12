import { Command } from "commander";
import { validateDate } from "../../validator/index.js";
import { executeCommand, resolveEndpoint } from "../command-helper.js";

const TYPE_ENDPOINTS: Record<string, string> = {
  oil: "/svc/apis/gen/oil_bydd_trd",
  gold: "/svc/apis/gen/gold_bydd_trd",
  emission: "/svc/apis/gen/ets_bydd_trd",
};

export function registerCommodityCommand(program: Command): void {
  const commodity = program
    .command("commodity")
    .description("Query KRX commodity data (oil/gold/emission)");

  commodity
    .command("list")
    .description("List commodity daily trading data")
    .requiredOption("--date <date>", "trading date (YYYYMMDD)")
    .option("--type <type>", "type: oil, gold, emission", "gold")
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
