import type { Scenario } from "./types.js";

export const marketScenarios: readonly Scenario[] = [
  {
    id: "market-summary",
    description: "시장 요약 조회",
    prompt: "오늘 한국 주식시장 전체 요약을 보여줘.",
    expectedKeywords: {
      anyOf: ["KOSPI", "코스피", "KOSDAQ", "코스닥", "상승", "하락"],
    },
    expectedStructure: {
      minLength: 100,
      mustNotBeError: true,
    },
    maxTurns: 15,
    tags: ["market", "advanced"],
  },
];
