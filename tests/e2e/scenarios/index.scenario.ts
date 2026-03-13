import type { Scenario } from "./types.js";

export const indexScenarios: readonly Scenario[] = [
  {
    id: "index-kospi-basic",
    description: "KOSPI 지수 조회",
    prompt: "2026년 3월 10일 KOSPI 지수를 조회해줘.",
    expectedKeywords: {
      anyOf: ["코스피", "KOSPI", "지수", "IDX_NM", "CLSPRC_IDX"],
    },
    expectedStructure: {
      minLength: 100,
      mustNotBeError: true,
    },
    tags: ["index", "basic"],
  },
  {
    id: "index-kosdaq-basic",
    description: "KOSDAQ 지수 조회",
    prompt: "코스닥 지수 어제 기준으로 보여줘.",
    expectedKeywords: {
      anyOf: ["코스닥", "KOSDAQ"],
    },
    expectedStructure: {
      mustNotBeError: true,
    },
    tags: ["index", "basic"],
  },
];
