import { Command } from "commander";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { writeOutput } from "../../output/formatter.js";

function getLocalVersion(): string {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  // dist/cli.js → package.json (1 level up)
  // src/cli/commands/version.ts → package.json (3 levels up)
  const candidates = [
    resolve(__dirname, "..", "package.json"),
    resolve(__dirname, "..", "..", "..", "package.json"),
  ];

  for (const candidate of candidates) {
    try {
      const raw = readFileSync(candidate, "utf-8");
      const pkg = JSON.parse(raw) as { version: string };
      return pkg.version;
    } catch {
      continue;
    }
  }

  return "unknown";
}

async function getLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch("https://registry.npmjs.org/krx-cli/latest");
    if (!res.ok) return null;
    const data = (await res.json()) as { version: string };
    return data.version;
  } catch {
    return null;
  }
}

export function registerVersionCommand(program: Command): void {
  program
    .command("version")
    .description("Show current version and check for updates")
    .action(async () => {
      const current = getLocalVersion();
      const latest = await getLatestVersion();

      const result: Record<string, string | boolean> = {
        current,
      };

      if (latest) {
        result.latest = latest;
        result.updateAvailable = current !== latest;
        if (current !== latest) {
          result.updateCommand = "npm install -g krx-cli";
        }
      }

      writeOutput(JSON.stringify(result, null, 2));
    });
}

export function getVersion(): string {
  return getLocalVersion();
}
