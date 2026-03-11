import { Command } from "commander";
import { execSync } from "node:child_process";
import { writeOutput, writeError } from "../../output/formatter.js";
import { getVersion } from "./version.js";

export function registerUpdateCommand(program: Command): void {
  program
    .command("update")
    .description("Update krx-cli to the latest version")
    .action(async () => {
      const current = getVersion();

      try {
        const res = await fetch("https://registry.npmjs.org/krx-cli/latest");
        if (!res.ok) {
          writeError("Failed to check latest version from npm registry");
          process.exit(1);
        }
        const data = (await res.json()) as { version: string };
        const latest = data.version;

        if (current === latest) {
          writeOutput(
            JSON.stringify({
              message: "Already up to date",
              version: current,
            }),
          );
          return;
        }

        process.stderr.write(`Updating krx-cli: ${current} → ${latest}...\n`);

        execSync("npm install -g krx-cli", { stdio: "inherit" });

        writeOutput(
          JSON.stringify({
            message: "Updated successfully",
            from: current,
            to: latest,
          }),
        );
      } catch (err) {
        writeError(
          `Update failed: ${err instanceof Error ? err.message : String(err)}`,
        );
        process.exit(1);
      }
    });
}
