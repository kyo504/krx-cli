import type { Scenario } from "./types.js";

export const commodityScenarios: readonly Scenario[] = [
  {
    id: "commodity-gold",
    description: "금 시세 조회",
    prompt: "금 시세를 조회해줘.",
    expectedKeywords: {
      anyOf: ["ISU_NM", "TDD_CLSPRC", "금"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["commodity", "basic"],
  },
  {
    id: "commodity-oil",
    description: "유류 시세 조회",
    prompt: "석유 시세를 보여줘.",
    expectedKeywords: {
      anyOf: ["OIL_NM", "WT_AVG_PRC", "유"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["commodity", "basic"],
  },
];
