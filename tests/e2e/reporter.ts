import { writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import type { EvalResult } from "./evaluators/types.js";

export interface ScenarioReport {
  readonly scenarioId: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly passed: boolean;
  readonly durationMs: number;
  readonly costUsd: number;
  readonly numTurns: number;
  readonly isError: boolean;
  readonly evalResults: readonly (EvalResult & {
    readonly evaluator: string;
  })[];
  readonly resultPreview: string;
}

interface CategorySummary {
  readonly category: string;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly totalDurationMs: number;
  readonly totalCostUsd: number;
  readonly avgTurns: number;
}

interface TestReport {
  readonly timestamp: string;
  readonly model: string;
  readonly total: number;
  readonly passed: number;
  readonly failed: number;
  readonly passRate: string;
  readonly totalDurationMs: number;
  readonly totalCostUsd: number;
  readonly avgTurns: number;
  readonly avgDurationMs: number;
  readonly categories: readonly CategorySummary[];
  readonly scenarios: readonly ScenarioReport[];
  readonly failures: readonly ScenarioReport[];
}

function pad(str: string, len: number): string {
  return str.length >= len
    ? str.slice(0, len)
    : str + " ".repeat(len - str.length);
}

function padLeft(str: string, len: number): string {
  return str.length >= len
    ? str.slice(0, len)
    : " ".repeat(len - str.length) + str;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatCost(usd: number): string {
  return `$${usd.toFixed(4)}`;
}

function buildCategorySummaries(
  reports: readonly ScenarioReport[],
): readonly CategorySummary[] {
  const categoryMap = new Map<string, ScenarioReport[]>();

  for (const report of reports) {
    const category = report.tags[0] ?? "unknown";
    const existing = categoryMap.get(category) ?? [];
    categoryMap.set(category, [...existing, report]);
  }

  return [...categoryMap.entries()].map(([category, items]) => {
    const passed = items.filter((r) => r.passed).length;
    const totalTurns = items.reduce((sum, r) => sum + r.numTurns, 0);

    return {
      category,
      total: items.length,
      passed,
      failed: items.length - passed,
      totalDurationMs: items.reduce((sum, r) => sum + r.durationMs, 0),
      totalCostUsd: items.reduce((sum, r) => sum + r.costUsd, 0),
      avgTurns: items.length > 0 ? totalTurns / items.length : 0,
    };
  });
}

function buildReport(
  reports: readonly ScenarioReport[],
  model: string,
): TestReport {
  const passed = reports.filter((r) => r.passed).length;
  const total = reports.length;
  const totalDurationMs = reports.reduce((sum, r) => sum + r.durationMs, 0);
  const totalCostUsd = reports.reduce((sum, r) => sum + r.costUsd, 0);
  const totalTurns = reports.reduce((sum, r) => sum + r.numTurns, 0);

  return {
    timestamp: new Date().toISOString(),
    model,
    total,
    passed,
    failed: total - passed,
    passRate: total > 0 ? `${((passed / total) * 100).toFixed(1)}%` : "N/A",
    totalDurationMs,
    totalCostUsd,
    avgTurns: total > 0 ? totalTurns / total : 0,
    avgDurationMs: total > 0 ? totalDurationMs / total : 0,
    categories: buildCategorySummaries(reports),
    scenarios: reports,
    failures: reports.filter((r) => !r.passed),
  };
}

function renderConsoleReport(report: TestReport): string {
  const lines: string[] = [];
  const divider = "=".repeat(90);
  const thinDivider = "-".repeat(90);

  lines.push("");
  lines.push(divider);
  lines.push("  KRX CLI E2E 시나리오 테스트 리포트");
  lines.push(divider);
  lines.push("");

  // Overall summary
  lines.push(`  모델: ${report.model}`);
  lines.push(`  실행 시각: ${report.timestamp}`);
  lines.push(`  총 소요 시간: ${formatDuration(report.totalDurationMs)}`);
  lines.push(`  총 API 비용: ${formatCost(report.totalCostUsd)}`);
  lines.push("");

  const passIcon = report.failed === 0 ? "PASS" : "FAIL";
  lines.push(
    `  결과: ${passIcon}  ${report.passed}/${report.total} (${report.passRate})`,
  );
  lines.push("");

  // Category summary table
  lines.push(thinDivider);
  lines.push(
    `  ${pad("카테고리", 14)} ${padLeft("통과", 6)} ${padLeft("실패", 6)} ${padLeft("소요시간", 10)} ${padLeft("비용", 10)} ${padLeft("평균턴", 8)}`,
  );
  lines.push(thinDivider);

  for (const cat of report.categories) {
    const status = cat.failed === 0 ? "OK" : "NG";
    lines.push(
      `  ${pad(`${status} ${cat.category}`, 14)} ${padLeft(String(cat.passed), 6)} ${padLeft(String(cat.failed), 6)} ${padLeft(formatDuration(cat.totalDurationMs), 10)} ${padLeft(formatCost(cat.totalCostUsd), 10)} ${padLeft(cat.avgTurns.toFixed(1), 8)}`,
    );
  }

  lines.push(thinDivider);
  lines.push("");

  // Per-scenario table
  lines.push(thinDivider);
  lines.push(
    `  ${pad("시나리오", 26)} ${padLeft("결과", 6)} ${padLeft("시간", 10)} ${padLeft("턴", 5)} ${padLeft("비용", 10)} 평가`,
  );
  lines.push(thinDivider);

  for (const s of report.scenarios) {
    const status = s.passed ? "PASS" : "FAIL";
    const evalSummary = s.evalResults
      .map((e) => `${e.evaluator}:${e.passed ? "OK" : "NG"}`)
      .join(" ");

    lines.push(
      `  ${pad(s.scenarioId, 26)} ${padLeft(status, 6)} ${padLeft(formatDuration(s.durationMs), 10)} ${padLeft(String(s.numTurns), 5)} ${padLeft(formatCost(s.costUsd), 10)} ${evalSummary}`,
    );
  }

  lines.push(thinDivider);
  lines.push("");

  // Failed scenarios detail
  if (report.failures.length > 0) {
    lines.push(`  실패 시나리오 상세 (${report.failures.length}건)`);
    lines.push(thinDivider);

    for (const f of report.failures) {
      lines.push(`  [${f.scenarioId}] ${f.description}`);

      for (const e of f.evalResults) {
        if (!e.passed) {
          lines.push(`    ${e.evaluator}: ${e.message}`);
        }
      }

      lines.push(`    응답 미리보기: ${f.resultPreview.slice(0, 150)}...`);
      lines.push("");
    }

    lines.push(thinDivider);
  }

  // Summary footer
  lines.push(
    `  평균 소요시간: ${formatDuration(report.avgDurationMs)} | 평균 턴: ${report.avgTurns.toFixed(1)} | 총 비용: ${formatCost(report.totalCostUsd)}`,
  );
  lines.push(divider);
  lines.push("");

  return lines.join("\n");
}

function saveJsonReport(report: TestReport, outputDir: string): string {
  mkdirSync(outputDir, { recursive: true });
  const timestamp = report.timestamp.replace(/[:.]/g, "-").slice(0, 19);
  const filePath = resolve(outputDir, `e2e-report-${timestamp}.json`);
  writeFileSync(filePath, JSON.stringify(report, null, 2));
  return filePath;
}

export function generateReport(
  reports: readonly ScenarioReport[],
  model: string,
  options?: { readonly saveJson?: boolean; readonly outputDir?: string },
): void {
  const report = buildReport(reports, model);
  const consoleOutput = renderConsoleReport(report);

  console.log(consoleOutput);

  if (options?.saveJson) {
    const outputDir =
      options.outputDir ?? resolve(process.cwd(), "tests/e2e/reports");
    const filePath = saveJsonReport(report, outputDir);
    console.log(`  JSON 리포트 저장: ${filePath}\n`);
  }
}
