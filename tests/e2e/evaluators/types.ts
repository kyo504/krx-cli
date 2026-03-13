import type { RunResult, Scenario } from "../scenarios/types.js";

export interface EvalResult {
  readonly passed: boolean;
  readonly message: string;
}

export interface Evaluator {
  readonly name: string;
  evaluate(result: RunResult, scenario: Scenario): EvalResult;
}
