import { spawn } from "node:child_process";
import type { RunResult, Scenario } from "./scenarios/types.js";
import type { E2EConfig } from "./config.js";

interface ClaudeJsonOutput {
  readonly type: string;
  readonly subtype: string;
  readonly result: string;
  readonly total_cost_usd: number;
  readonly num_turns: number;
  readonly is_error: boolean;
  readonly duration_ms: number;
  readonly duration_api_ms: number;
  readonly session_id: string;
}

function buildCleanEnv(): NodeJS.ProcessEnv {
  const env = { ...process.env };
  delete env["CLAUDECODE"];
  return env;
}

function spawnClaude(
  args: readonly string[],
  cwd: string,
  timeoutMs: number,
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn("claude", [...args], {
      cwd,
      env: buildCleanEnv(),
      stdio: ["ignore", "pipe", "pipe"],
      detached: true,
    });

    let stdout = "";
    let stderr = "";
    let killed = false;

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      killed = true;
      try {
        process.kill(-child.pid!, "SIGKILL");
      } catch {
        child.kill("SIGKILL");
      }
    }, timeoutMs);

    child.on("close", (code) => {
      clearTimeout(timer);

      if (killed) {
        reject(new Error(`Timed out after ${timeoutMs}ms`));
        return;
      }

      if (code !== 0) {
        reject(
          new Error(`Exit code ${code}${stderr ? `\nstderr: ${stderr}` : ""}`),
        );
        return;
      }

      resolve({ stdout, stderr });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

export async function runScenario(
  scenario: Scenario,
  config: E2EConfig,
): Promise<RunResult> {
  const model = scenario.model ?? config.model;
  const maxTurns = scenario.maxTurns ?? config.maxTurns;

  const args = [
    "-p",
    scenario.prompt,
    "--output-format",
    "json",
    "--model",
    model,
    "--max-turns",
    String(maxTurns),
    "--permission-mode",
    "bypassPermissions",
  ];

  const start = Date.now();

  try {
    const { stdout } = await spawnClaude(args, config.cwd, config.timeoutMs);
    const output = JSON.parse(stdout) as ClaudeJsonOutput;

    const noResult = output.result === undefined || output.result === null;
    const isMaxTurns = output.subtype === "error_max_turns";

    return {
      result: noResult
        ? isMaxTurns
          ? `[max_turns reached after ${output.num_turns} turns]`
          : `[no result, subtype: ${output.subtype}]`
        : output.result,
      costUsd: output.total_cost_usd ?? 0,
      numTurns: output.num_turns ?? 0,
      isError: output.is_error ?? noResult,
      durationMs: output.duration_ms ?? Date.now() - start,
    };
  } catch (error: unknown) {
    const duration = Date.now() - start;
    const message = error instanceof Error ? error.message : String(error);

    return {
      result: `Runner error: ${message}`,
      costUsd: 0,
      numTurns: 0,
      isError: true,
      durationMs: duration,
    };
  }
}
