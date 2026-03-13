export interface KeywordExpectation {
  readonly mustContain?: readonly string[];
  readonly mustNotContain?: readonly string[];
  readonly anyOf?: readonly string[];
}

export interface StructureExpectation {
  readonly minLength?: number;
  readonly mustNotBeError?: boolean;
  readonly maxTurns?: number;
}

export interface Scenario {
  readonly id: string;
  readonly description: string;
  readonly prompt: string;
  readonly expectedKeywords?: KeywordExpectation;
  readonly expectedStructure?: StructureExpectation;
  readonly tags?: readonly string[];
  readonly maxTurns?: number;
  readonly model?: string;
}

export interface RunResult {
  readonly result: string;
  readonly costUsd: number;
  readonly numTurns: number;
  readonly isError: boolean;
  readonly durationMs: number;
}
