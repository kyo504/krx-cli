import { Command } from "commander";
import {
  saveApiKey,
  getApiKey,
  checkAllCategories,
  checkCategoryApproval,
} from "../../client/auth.js";
import type { CategoryId } from "../../client/endpoints.js";
import { CATEGORIES } from "../../client/endpoints.js";
import {
  writeOutput,
  writeError,
  formatOutput,
  detectOutputFormat,
} from "../../output/formatter.js";
import { EXIT_CODES } from "../index.js";

export function registerAuthCommand(program: Command): void {
  const auth = program
    .command("auth")
    .description("Manage API key and service approvals");

  auth
    .command("set <api-key>")
    .description("Save KRX API key")
    .action((apiKey: string) => {
      saveApiKey(apiKey);
      writeOutput(JSON.stringify({ success: true, message: "API key saved" }));
    });

  auth
    .command("status")
    .description("Check API key and service approval status")
    .action(async () => {
      const apiKey = getApiKey();
      if (!apiKey) {
        writeError(
          "No API key configured. Use 'krx auth set <key>' or set KRX_API_KEY env var.",
        );
        process.exit(EXIT_CODES.AUTH_FAILURE);
      }

      writeError("Checking service approvals...");
      const statuses = await checkAllCategories(apiKey);

      const format = detectOutputFormat(
        program.parent?.opts().output ?? program.opts().output,
      );

      const result = {
        api_key_set: true,
        services: statuses,
      };

      if (format === "json" || format === "ndjson") {
        writeOutput(JSON.stringify(result, null, 2));
      } else {
        const rows = CATEGORIES.map((cat) => {
          const status = statuses[cat.id];
          return {
            category: cat.id,
            name: cat.nameKo,
            approved: status?.approved ? "YES" : "NO",
            checked_at: status?.checkedAt ?? "-",
          };
        });
        writeOutput(
          formatOutput(
            rows as unknown as Record<string, unknown>[],
            "table",
          ),
        );
      }
    });

  auth
    .command("check <category>")
    .description("Check approval for a specific category")
    .action(async (category: string) => {
      const apiKey = getApiKey();
      if (!apiKey) {
        writeError(
          "No API key configured. Use 'krx auth set <key>' or set KRX_API_KEY env var.",
        );
        process.exit(EXIT_CODES.AUTH_FAILURE);
      }

      const validCategories = CATEGORIES.map((c) => c.id);
      if (!validCategories.includes(category as CategoryId)) {
        writeError(
          `Invalid category: ${category}. Must be one of: ${validCategories.join(", ")}`,
        );
        process.exit(EXIT_CODES.USAGE_ERROR);
      }

      const status = await checkCategoryApproval(
        apiKey,
        category as CategoryId,
      );
      writeOutput(JSON.stringify({ category, ...status }, null, 2));
    });
}
