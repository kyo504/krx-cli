import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { allScenarios } from "./scenarios/registry.js";
import { runScenario } from "./runner.js";
import { getConfig, validatePrerequisites } from "./config.js";
import { keywordEvaluator } from "./evaluators/keyword.js";
import { structureEvaluator } from "./evaluators/structure.js";
import { generateReport, type ScenarioReport } from "./reporter.js";

const config = getConfig();
const evaluators = [keywordEvaluator, structureEvaluator];

beforeAll(() => {
  validatePrerequisites(config);
});

describe("E2E Scenario Tests", () => {
  const reports: ScenarioReport[] = [];

  afterAll(() => {
    if (reports.length > 0) {
      generateReport(reports, config.model, { saveJson: true });
    }
  });

  for (const scenario of allScenarios) {
    it(
      `[${scenario.id}] ${scenario.description}`,
      async () => {
        const result = await runScenario(scenario, config);

        const evalResults = evaluators.map((e) => ({
          ...e.evaluate(result, scenario),
          evaluator: e.name,
        }));

        const passed = evalResults.every((r) => r.passed);

        reports.push({
          scenarioId: scenario.id,
          description: scenario.description,
          tags: scenario.tags ?? [],
          passed,
          durationMs: result.durationMs,
          costUsd: result.costUsd,
          numTurns: result.numTurns,
          isError: result.isError,
          evalResults,
          resultPreview: (result.result ?? "").slice(0, 300),
        });

        for (const er of evalResults) {
          expect(er.passed, er.message).toBe(true);
        }
      },
      config.timeoutMs,
    );
  }
});
