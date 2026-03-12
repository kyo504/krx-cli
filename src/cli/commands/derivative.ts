import { Command } from "commander";
import { validateDate } from "../../validator/index.js";
import { executeCommand, resolveEndpoint } from "../command-helper.js";

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
