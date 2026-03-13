import type { Scenario } from "./types.js";

export const stockScenarios: readonly Scenario[] = [
  {
    id: "stock-list-kospi",
    description: "KOSPI 주식 시세 조회",
    prompt: "KOSPI 주식 시세를 조회해줘.",
    expectedKeywords: {
      anyOf: ["ISU_NM", "TDD_CLSPRC", "종가", "시세"],
    },
    expectedStructure: {
      minLength: 50,
      mustNotBeError: true,
    },
    tags: ["stock", "basic"],
  },
  {
    id: "stock-top-gainers",
    description: "상승률 상위 종목 조회",
    prompt: "오늘 KOSPI에서 상승률이 가장 높은 종목 5개를 알려줘.",
    expectedKeywords: {
      anyOf: ["ISU_NM", "FLUC_RT", "TDD_CLSPRC", "상승", "등락"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["stock", "advanced"],
  },
];
