import { Command } from "commander";
import { registerAuthCommand } from "./commands/auth.js";
import { registerIndexCommand } from "./commands/index-cmd.js";
import { registerStockCommand } from "./commands/stock.js";
import { registerEtpCommand } from "./commands/etp.js";
import { registerBondCommand } from "./commands/bond.js";
import { registerDerivativeCommand } from "./commands/derivative.js";
import { registerCommodityCommand } from "./commands/commodity.js";
import { registerEsgCommand } from "./commands/esg.js";
import { registerSchemaCommand } from "./commands/schema.js";
import { registerVersionCommand, getVersion } from "./commands/version.js";
import { registerUpdateCommand } from "./commands/update.js";
import { writeError } from "../output/formatter.js";

const EXIT_CODES = {
  SUCCESS: 0,
  GENERAL_ERROR: 1,
  USAGE_ERROR: 2,
  NO_DATA: 3,
  AUTH_FAILURE: 4,
  RATE_LIMIT: 5,
  SERVICE_NOT_APPROVED: 6,
} as const;

export { EXIT_CODES };

const program = new Command();

program
  .name("krx")
  .description("Agent-native CLI for KRX (Korea Exchange) Open API")
  .version(getVersion())
  .option("-o, --output <format>", "output format: json, table, ndjson")
  .option("-f, --fields <fields>", "comma-separated fields to include")
  .option("--dry-run", "show request without calling API")
  .option("-v, --verbose", "verbose output to stderr");

registerAuthCommand(program);
registerIndexCommand(program);
registerStockCommand(program);
registerEtpCommand(program);
registerBondCommand(program);
registerDerivativeCommand(program);
registerCommodityCommand(program);
registerEsgCommand(program);
registerSchemaCommand(program);
registerVersionCommand(program);
registerUpdateCommand(program);

program.exitOverride();

try {
  await program.parseAsync(process.argv);
} catch (err) {
  if (err instanceof Error && "exitCode" in err) {
    const exitCode = (err as Error & { exitCode: number }).exitCode;
    process.exit(exitCode);
  }
  writeError(err instanceof Error ? err.message : String(err));
  process.exit(EXIT_CODES.GENERAL_ERROR);
}
