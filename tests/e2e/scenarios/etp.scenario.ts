import type { Scenario } from "./types.js";

export const etpScenarios: readonly Scenario[] = [
  {
    id: "etp-etf-list",
    description: "ETF 시세 조회",
    prompt: "ETF 시세를 조회해줘. 상위 5개만 보여줘.",
    expectedKeywords: {
      anyOf: ["ISU_NM", "TDD_CLSPRC", "NAV", "ETF"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["etp", "basic"],
  },
  {
    id: "etp-etn-list",
    description: "ETN 시세 조회",
    prompt: "ETN 시세 현황을 보여줘.",
    expectedKeywords: {
      anyOf: ["ISU_NM", "TDD_CLSPRC", "ETN"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["etp", "basic"],
  },
];
