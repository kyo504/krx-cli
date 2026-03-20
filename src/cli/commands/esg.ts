import { Command } from "commander";
import {
  executeCommand,
  resolveEndpoint,
  resolveDate,
} from "../command-helper.js";

const TYPE_ENDPOINTS: Record<string, string> = {
  "sri-bond": "/svc/apis/esg/sri_bond_info",
  etp: "/svc/apis/esg/esg_etp_info",
  index: "/svc/apis/esg/esg_index_info",
};

export function registerEsgCommand(program: Command): void {
  const esg = program.command("esg").description("Query KRX ESG data");

  esg
    .command("list")
    .description("List ESG data")
    .option("--date <date>", "trading date (YYYYMMDD)")
    .option("--type <type>", "type: sri-bond, etp, index", "index")
    .action(async (opts: { date?: string; type: string }) => {
      const date = resolveDate(opts.date, program);
      const endpoint = resolveEndpoint(TYPE_ENDPOINTS, opts.type, "type");

      await executeCommand({
        endpoint,
        params: { basDd: date },
        program,
        noDataMessage: `No data for date ${date}`,
      });
    });
}
