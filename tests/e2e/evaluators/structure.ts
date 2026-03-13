import type { RunResult, Scenario } from "../scenarios/types.js";
import type { EvalResult, Evaluator } from "./types.js";

export const structureEvaluator: Evaluator = {
  name: "structure",

  evaluate(result: RunResult, scenario: Scenario): EvalResult {
    const structure = scenario.expectedStructure;

    if (!structure) {
      return { passed: true, message: "No structure expectations" };
    }

    if (structure.mustNotBeError && result.isError) {
      return {
        passed: false,
        message: `Expected success but got error: ${result.result.slice(0, 200)}`,
      };
    }

    if (structure.minLength && result.result.length < structure.minLength) {
      return {
        passed: false,
        message: `Response too short: ${result.result.length} < ${structure.minLength}`,
      };
    }

    if (structure.maxTurns && result.numTurns > structure.maxTurns) {
      return {
        passed: false,
        message: `Too many turns: ${result.numTurns} > ${structure.maxTurns}`,
      };
    }

    return { passed: true, message: "All structure checks passed" };
  },
};
