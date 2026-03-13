import type { Scenario } from "./types.js";

export const derivativeScenarios: readonly Scenario[] = [
  {
    id: "derivative-futures",
    description: "선물 시세 조회",
    prompt: "선물 시세를 조회해줘.",
    expectedKeywords: {
      anyOf: ["ISU_NM", "PROD_NM", "TDD_CLSPRC", "선물"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["derivative", "basic"],
  },
  {
    id: "derivative-options",
    description: "옵션 시세 조회",
    prompt: "옵션 시세 현황을 보여줘.",
    expectedKeywords: {
      anyOf: ["ISU_NM", "PROD_NM", "TDD_CLSPRC", "옵션"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["derivative", "basic"],
  },
];
