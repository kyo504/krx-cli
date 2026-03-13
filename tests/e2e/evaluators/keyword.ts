import type { RunResult, Scenario } from "../scenarios/types.js";
import type { EvalResult, Evaluator } from "./types.js";

export const keywordEvaluator: Evaluator = {
  name: "keyword",

  evaluate(result: RunResult, scenario: Scenario): EvalResult {
    const keywords = scenario.expectedKeywords;

    if (!keywords) {
      return { passed: true, message: "No keyword expectations" };
    }

    const text = (result.result ?? "").toLowerCase();

    if (keywords.mustContain) {
      for (const kw of keywords.mustContain) {
        if (!text.includes(kw.toLowerCase())) {
          return {
            passed: false,
            message: `Missing required keyword: "${kw}"`,
          };
        }
      }
    }

    if (keywords.mustNotContain) {
      for (const kw of keywords.mustNotContain) {
        if (text.includes(kw.toLowerCase())) {
          return {
            passed: false,
            message: `Contains forbidden keyword: "${kw}"`,
          };
        }
      }
    }

    if (keywords.anyOf) {
      const found = keywords.anyOf.some((kw) =>
        text.includes(kw.toLowerCase()),
      );

      if (!found) {
        return {
          passed: false,
          message: `None of expected keywords found: [${keywords.anyOf.join(", ")}]`,
        };
      }
    }

    return { passed: true, message: "All keyword checks passed" };
  },
};
