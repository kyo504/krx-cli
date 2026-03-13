import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

export interface E2EConfig {
  readonly model: string;
  readonly maxTurns: number;
  readonly timeoutMs: number;
  readonly cwd: string;
}

export function getConfig(): E2EConfig {
  const cwd = resolve(process.env["E2E_CWD"] ?? process.cwd());

  return {
    model: process.env["E2E_MODEL"] ?? "sonnet",
    maxTurns: Number(process.env["E2E_MAX_TURNS"] ?? "10"),
    timeoutMs: Number(process.env["E2E_TIMEOUT_MS"] ?? "180000"),
    cwd,
  };
}

export function validatePrerequisites(config: E2EConfig): void {
  try {
    execFileSync("claude", ["--version"], { stdio: "pipe" });
  } catch {
    throw new Error(
      "claude CLI not found. Install: npm install -g @anthropic-ai/claude-code",
    );
  }

  if (!existsSync(resolve(config.cwd, "dist/cli.js"))) {
    throw new Error("dist/cli.js not found. Run 'pnpm build' first.");
  }
}
