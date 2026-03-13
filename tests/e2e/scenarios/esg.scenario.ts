import type { Scenario } from "./types.js";

export const esgScenarios: readonly Scenario[] = [
  {
    id: "esg-index",
    description: "ESG 지수 조회",
    prompt: "ESG 지수를 조회해줘.",
    expectedKeywords: {
      anyOf: ["IDX_NM", "CLSPRC_IDX", "ESG"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["esg", "basic"],
  },
  {
    id: "esg-sri-bond",
    description: "SRI 채권 조회",
    prompt: "SRI 채권 현황을 보여줘.",
    expectedKeywords: {
      anyOf: ["ISU_NM", "SRI", "채권", "ESG"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["esg", "basic"],
  },
];
